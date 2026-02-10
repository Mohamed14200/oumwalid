import os
import json
import requests

# =============================
# مفاتيح API من Secrets
# =============================

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")
GEMINI_API_KEY = "AIzaSyBT1zuFacNaEXLBYjsay91U7ADzrWWNR54"

if not YOUTUBE_API_KEY or not GEMINI_API_KEY:
    print("❌ مفاتيح API غير موجودة")
    exit()

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
    {{ "name": "...", "quantity": "...", "unit": "..." }}
  ],
  "steps": [
    "خطوة 1"
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

# === الحصول على النص الناتج ===
try:
    gemini_text = gemini_data["candidates"][0]["content"]["parts"][0]["text"]
except (KeyError, IndexError):
    print("❌ خطأ في استجابة Gemini")
    print(gemini_data)
    exit()

# === تنظيف النص وتحويله إلى JSON ===
try:
    # إزالة أي فراغات أو أسطر غير مرغوب فيها
    gemini_text_clean = gemini_text.strip()

    # أحيانًا Gemini يضع علامات اقتباس خاطئة أو يضيف نص قبل/بعد JSON
    start = gemini_text_clean.find("{")
    end = gemini_text_clean.rfind("}") + 1
    json_str = gemini_text_clean[start:end]

    recipe_data = json.loads(json_str)
except json.JSONDecodeError:
    print("❌ Gemini لم يُرجع JSON صالح")
    print("النص:", gemini_text)
    exit()

# === تحميل ملف الوصفات الحالي ===
json_file = "recipes.json"
if os.path.exists(json_file):
    with open(json_file, "r", encoding="utf-8") as f:
        recipes = json.load(f)
else:
    recipes = []

# === إنشاء ID جديد ===
new_id = str(int(recipes[-1]["id"]) + 1) if recipes else "1"

# === إضافة الوصفة الجديدة ===
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

# === حفظ الملف ===
with open(json_file, "w", encoding="utf-8") as f:
    json.dump(recipes, f, ensure_ascii=False, indent=4)

print("✅ تم تحديث recipes.json بالوصفة الجديدة!")
