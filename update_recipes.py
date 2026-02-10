import os
import json
import requests

# --- جلب المفتاح من سكريت ---
API_KEY = os.environ.get("YOUTUBE_API_KEY")
CHANNEL_ID = "UCVXD2kNki3rfLMhF8uNIcBQ"

url = "https://www.googleapis.com/youtube/v3/search"

params = {
    "key": API_KEY,
    "channelId": CHANNEL_ID,
    "part": "snippet",
    "order": "date",
    "maxResults": 1,
    "type": "video"
}

response = requests.get(url, params=params)
data = response.json()

if "items" not in data or len(data["items"]) == 0:
    print("❌ لم يتم العثور على فيديوهات")
    exit()

# --- آخر فيديو ---
video = data["items"][0]
video_id = video["id"]["videoId"]
title = video["snippet"]["title"]
description = video["snippet"]["description"]
published_at = video["snippet"]["publishedAt"]
thumbnail = video["snippet"]["thumbnails"]["high"]["url"]

print("✅ آخر فيديو:")
print("العنوان:", title)
print("الرابط:", f"https://www.youtube.com/watch?v={video_id}")
print("تاريخ النشر:", published_at)

# --- تحديث recipes.json ---
recipe = {
    "id": video_id,
    "title": title,
    "description": description,
    "thumbnail": thumbnail,
    "video_url": f"https://www.youtube.com/watch?v={video_id}"
}

# قراءة الملف الحالي
try:
    with open("recipes.json", "r", encoding="utf-8") as f:
        recipes = json.load(f)
except FileNotFoundError:
    recipes = []

# تحقق من وجود الفيديو مسبقًا
if any(r["id"] == video_id for r in recipes):
    print("ℹ️ هذا الفيديو موجود مسبقًا في recipes.json")
else:
    recipes.append(recipe)
    with open("recipes.json", "w", encoding="utf-8") as f:
        json.dump(recipes, f, ensure_ascii=False, indent=4)
    print("✅ تم تحديث recipes.json بنجاح.")
