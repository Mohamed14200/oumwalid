import os
import json
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

# ===============================
# إعداد Service Account (Gemini)
# ===============================
SERVICE_ACCOUNT_FILE = "gemini-service-account.json"
PROJECT_ID = "oumwalid-recipes"
LOCATION = "us-central1"
MODEL = "gemini-2.0-flash"

SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)
credentials.refresh(Request())

ACCESS_TOKEN = credentials.token

# ===============================
# إعداد YouTube API
# ===============================
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")
CHANNEL_ID = "UCVXD2kNki3rfLMhF8uNIcBQ"

youtube_url = "https://www.googleapis.com/youtube/v3/search"
youtube_params = {
    "key": YOUTUBE_API_KEY,
    "channelId": CHANNEL_ID,
    "part": "snippet",
    "order": "date",
    "maxResults": 1,
    "type": "video"
}

# ===============================
# جلب آخر فيديو
# ===============================
response = requests.get(youtube_url, params=youtube_params)
data = response.json()

if "items" not in data or len(data["items"]) == 0:
    print("❌ لم يتم العثور على فيديوهات")
    exit()

video = data["items"][0]
video_id = video["id"]["videoId"]
title = video["snippet"]["title"]
published_at = video["snippet"]["publishedAt"]
thumbnail = video["snippet"]["thumbnails"]["high"]["url"]

print("✅ آخر فيديو:")
print("العنوان:", title)
print("الرابط:", f"https://www.youtube.com/watch?v={video_id}")

# ===============================
# طلب Gemini عبر Vertex AI
# ===============================
gemini_url = (
    f"https://{LOCATION}-aiplatform.googleapis.com/v1/"
    f"projects/{PROJECT_ID}/locations/{LOCATION}/"
    f"publishers/google/models/{MODEL}:generateContent"
)

prompt_text = f"""
أريد منك استخراج وصفة طعام من هذا الفيديو:
العنوان: {title}
الرابط: https://www.youtube.com/watch?v={video_id}

رجاءً أعطني النتائج بصيغة JSON فقط دون أي شرح:
{{
  "ingredients": [
    {{ "name": "...", "quantity": "...", "unit": "..." }}
  ],
  "steps": [
    "خطوة 1",
    "خطوة 2"
  ]
}}
"""

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

body = {
    "contents": [
        {
            "role": "user",
            "parts": [{"text": prompt_text}]
        }
    ]
}

gemini_response = requests.post(gemini_url, headers=headers, json=body)
gemini_data = gemini_response.json()

try:
    gemini_text = gemini_data["candidates"][0]["content"]["parts"][0]["text"]
except (KeyError, IndexError):
    print("❌ خطأ في استجابة Gemini")
    print(json.dumps(gemini_data, indent=2, ensure_ascii=False))
    exit()

# ===============================
# تحويل JSON
# ===============================
try:
    recipe_data = json.loads(gemini_text)
except json.JSONDecodeError:
    print("❌ Gemini لم تُرجع JSON صالح")
    print(gemini_text)
    exit()

# ===============================
# تحديث recipes.json
# ===============================
json_file = "recipes.json"

if os.path.exists(json_file):
    with open(json_file, "r", encoding="utf-8") as f:
        recipes = json.load(f)
else:
    recipes = []

new_id = str(int(recipes[-1]["id"]) + 1) if recipes else "1"

new_recipe = {
    "id": new_id,
    "title": title,
    "description": f"وصفة مستخلصة من فيديو YouTube: {title}",
    "image": thumbnail,
    "prepTime": 15,
    "cookTime": 30,
    "servings": 4,
    "difficulty": 2,
    "category": "أطباق رئيسية",
    "youtubeUrl": f"https://www.youtube.com/watch?v={video_id}",
    "ingredients": recipe_data.get("ingredients", []),
    "steps": recipe_data.get("steps", [])
}

recipes.append(new_recipe)

with open(json_file, "w", encoding="utf-8") as f:
    json.dump(recipes, f, ensure_ascii=False, indent=4)

print("✅ تم تحديث recipes.json بنجاح!")
