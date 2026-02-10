import os
import json
import requests

# === إعداد مفاتيح API ===
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# === بيانات القناة ===
CHANNEL_ID = "UCVXD2kNki3rfLMhF8uNIcBQ"

# === URL YouTube API ===
youtube_url = "https://www.googleapis.com/youtube/v3/search"

youtube_params = {
    "key": YOUTUBE_API_KEY,
    "channelId": CHANNEL_ID,
    "part": "snippet",
    "order": "date",
    "maxResults": 1,
    "type": "video"
}

# === جلب آخر فيديو ===
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
print("تاريخ النشر:", published_at)
print("صورة مصغرة:", thumbnail)

# === طلب Gemini لتوليد المكونات والخطوات ===
gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

prompt_text = f"""
أريد منك استخراج وصفة طعام من هذا الفيديو:
العنوان: {title}
الرابط: https://www.youtube.com/watch?v={video_id}

رجاءً أعطني النتائج بصيغة JSON كما يلي:
{{
  "ingredients": [
    {{ "name": "...", "quantity": "...", "unit": "..." }},
    ...
  ],
  "steps": [
    "خطوة 1",
    "خطوة 2",
    ...
  ]
}}
"""

gemini_headers = {
    "x-goog-api-key": GEMINI_API_KEY,
    "Content-Type": "application/json"
}

gemini_body = {
    "contents": [
        {
            "parts": [{"text": prompt_text}]
        }
    ]
}

gemini_response = requests.post(gemini_url, headers=gemini_headers, json=gemini_body)
gemini_data = gemini_response.json()

try:
    gemini_text = gemini_data["candidates"][0]["content"]["parts"][0]["text"]
except (KeyError, IndexError):
    print("❌ خطأ في استجابة Gemini")
    print(gemini_data)
    exit()

# === تحويل النص الناتج من Gemini إلى JSON ===
try:
    recipe_data = json.loads(gemini_text)
except json.JSONDecodeError:
    print("❌ Gemini لم ترجع JSON صالح")
    print("النص:", gemini_text)
    exit()

# === تحميل ملف الوصفات الحالي ===
json_file = "recipes.json"
with open(json_file, "r", encoding="utf-8") as f:
    recipes = json.load(f)

# === إنشاء ID جديد ===
new_id = str(int(recipes[-1]["id"]) + 1) if recipes else "1"

# === إضافة الوصفة الجديدة ===
new_recipe = {
    "id": new_id,
    "title": title,
    "description": f"وصفة مستخلصة من فيديو YouTube: {title}",
    "image": thumbnail,
    "prepTime": 15,   # يمكنك تعديل الوقت إذا أردت
    "cookTime": 30,   # يمكنك تعديل الوقت إذا أردت
    "servings": 4,    # افتراضي
    "difficulty": 2,  # افتراضي
    "category": "أطباق رئيسية",  # افتراضي
    "youtubeUrl": f"https://www.youtube.com/watch?v={video_id}",
    "ingredients": recipe_data.get("ingredients", []),
    "steps": recipe_data.get("steps", [])
}

recipes.append(new_recipe)

# === حفظ الملف ===
with open(json_file, "w", encoding="utf-8") as f:
    json.dump(recipes, f, ensure_ascii=False, indent=4)

print("✅ تم تحديث recipes.json بالوصفة الجديدة!")

