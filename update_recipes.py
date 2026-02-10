import os
import json
import requests
from google.oauth2 import service_account
import google.auth.transport.requests

# =========================
# الإعدادات
# =========================

CHANNEL_ID = "UCVXD2kNki3rfLMhF8uNIcBQ"

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")

# ملف Service Account (موجود في المستودع مؤقتًا)
SERVICE_ACCOUNT_FILE = "gemini-service-account.json"

# =========================
# 1️⃣ جلب آخر فيديو من YouTube
# =========================

youtube_url = "https://www.googleapis.com/youtube/v3/search"

youtube_params = {
    "key": YOUTUBE_API_KEY,
    "channelId": CHANNEL_ID,
    "part": "snippet",
    "order": "date",
    "maxResults": 1,
    "type": "video"
}

response = requests.get(youtube_url, params=youtube_params)
data = response.json()

if "items" not in data or len(data["items"]) == 0:
    print("❌ لم يتم العثور على فيديوهات")
    exit(1)

video = data["items"][0]
video_id = video["id"]["videoId"]
title = video["snippet"]["title"]
published_at = video["snippet"]["publishedAt"]
thumbnail = video["snippet"]["thumbnails"]["high"]["url"]

print("✅ آخر فيديو:")
print("العنوان:", title)
print("الرابط:", f"https://www.youtube.com/watch?v={video_id}")
print("تاريخ النشر:", published_at)
print("صورة مصغرة:", thumbnail)

# =========================
# 2️⃣ المصادقة مع Gemini (Service Account)
# =========================

SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE,
    scopes=SCOPES
)

auth_req = google.auth.transport.requests.Request()
credentials.refresh(auth_req)

access_token = credentials.token

# =========================
# 3️⃣ طلب Gemini 2.0 Flash
# =========================

gemini_url = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/gemini-2.0-flash:generateContent"
)

prompt = f"""
أريد منك استخراج وصفة طبخ من فيديو يوتيوب.

عنوان الفيديو:
{title}

الرابط:
https://www.youtube.com/watch?v={video_id}

❗ أعد النتيجة بصيغة JSON فقط بدون أي شرح إضافي:

{{
  "ingredients": [
    {{ "name": "المكون", "quantity": "الكمية", "unit": "الوحدة" }}
  ],
  "steps": [
    "الخطوة الأولى",
    "الخطوة الثانية"
  ]
}}
"""

headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

body = {
    "contents": [
        {
            "parts": [
                {"text": prompt}
            ]
        }
    ]
}

gemini_response = requests.post(gemini_url, headers=headers, json=body)
gemini_data = gemini_response.json()

try:
    gemini_text = gemini_data["candidates"][0]["content"]["parts"][0]["text"]
except (KeyError, IndexError):
    print("❌ خطأ في استجابة Gemini")
    print(gemini_data)
    exit(1)

# =========================
# 4️⃣ تحويل JSON الناتج
# =========================

try:
    recipe_ai = json.loads(gemini_text)
except json.JSONDecodeError:
    print("❌ Gemini لم يرجع JSON صالح")
    print(gemini_text)
    exit(1)

# =========================
# 5️⃣ تحديث recipes.json
# =========================

RECIPES_FILE = "recipes.json"

with open(RECIPES_FILE, "r", encoding="utf-8") as f:
    recipes = json.load(f)

new_id = str(int(recipes[-1]["id"]) + 1) if recipes else "1"

new_recipe = {
    "id": new_id,
    "title": title,
    "description": f"وصفة مستخلصة تلقائيًا من فيديو YouTube",
    "image": thumbnail,
    "prepTime": 15,
    "cookTime": 30,
    "servings": 4,
    "difficulty": 2,
    "category": "أطباق رئيسية",
    "youtubeUrl": f"https://www.youtube.com/watch?v={video_id}",
    "ingredients": recipe_ai.get("ingredients", []),
    "steps": recipe_ai.get("steps", [])
}

recipes.append(new_recipe)

with open(RECIPES_FILE, "w", encoding="utf-8") as f:
    json.dump(recipes, f, ensure_ascii=False, indent=4)

print("✅ تم تحديث recipes.json بنجاح 🎉")
