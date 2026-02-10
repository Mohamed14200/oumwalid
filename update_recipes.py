import os
import json
import requests

# =============================
# مفاتيح API من Secrets
# =============================
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not YOUTUBE_API_KEY or not GEMINI_API_KEY:
    print("❌ مفاتيح API غير موجودة")
    exit()

# =============================
# بيانات قناة YouTube
# =============================
CHANNEL_ID = "UCVXD2kNki3rfLMhF8uNIcBQ"

# =============================
# جلب آخر فيديو من YouTube
# =============================
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

if "items" not in data or not data["items"]:
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
print("تاريخ النشر:", published_at)
print("صورة مصغرة:", thumbnail)

# =============================
# طلب Gemini 2.0 Flash
# =============================
gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

prompt = f"""
استخرج وصفة طبخ من هذا الفيديو:

العنوان: {title}
الرابط: https://www.youtube.com/watch?v={video_id}

أعد النتيجة بصيغة JSON فقط وبدون شرح:

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
    "Content-Type": "application/json",
    "x-goog-api-key": GEMINI_API_KEY
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

if "candidates" not in gemini_data:
    print("❌ خطأ في استجابة Gemini")
    print(gemini_data)
    exit()

gemini_text = gemini_data["candidates"][0]["content"]["parts"][0]["text"]

# =============================
# تحويل النص إلى JSON
# =============================
try:
    recipe_ai = json.loads(gemini_text)
except json.JSONDecodeError:
    print("❌ Gemini لم يُرجع JSON صالح")
    print(gemini_text)
    exit()

# =============================
# تحديث ملف recipes.json
# =============================
json_file = "recipes.json"

with open(json_file, "r", encoding="utf-8") as f:
    recipes = json.load(f)

existing_video_ids = [r.get("youtubeUrl") for r in recipes]
video_url = f"https://www.youtube.com/watch?v={video_id}"

if video_url in existing_video_ids:
    print("⚠️ هذا الفيديو موجود مسبقًا")
    exit()

new_id = str(int(recipes[-1]["id"]) + 1) if recipes else "1"

new_recipe = {
    "id": new_id,
    "title": title,
    "description": f"وصفة مستخرجة تلقائيًا من فيديو YouTube",
    "image": thumbnail,
    "prepTime": 15,
    "cookTime": 30,
    "servings": 4,
    "difficulty": 2,
    "category": "وصفات",
    "youtubeUrl": video_url,
    "ingredients": recipe_ai.get("ingredients", []),
    "steps": recipe_ai.get("steps", [])
}

recipes.append(new_recipe)

with open(json_file, "w", encoding="utf-8") as f:
    json.dump(recipes, f, ensure_ascii=False, indent=4)

print("✅ تم تحديث recipes.json بنجاح 🎉")
