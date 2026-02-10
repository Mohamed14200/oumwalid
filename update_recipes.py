import os
import requests

# قراءة مفتاح API من سكريت GitHub
API_KEY = os.environ.get("YOUTUBE_API_KEY")
if not API_KEY:
    print("❌ مفتاح API غير موجود في السكريت")
    exit()

CHANNEL_ID = "UCVXD2kNki3rfLMhF8uNIcBQ"

url = "https://www.googleapis.com/youtube/v3/search"

params = {
    "key": API_KEY,
    "channelId": CHANNEL_ID,
    "part": "snippet",
    "order": "date",     # ترتيب حسب الأحدث
    "maxResults": 1,     # آخر فيديو فقط
    "type": "video"
}

response = requests.get(url, params=params)
data = response.json()

# تحقق من وجود الفيديو
items = data.get("items", [])
if not items:
    print("❌ لم يتم العثور على فيديوهات")
    exit()

video = items[0]
video_id = video["id"]["videoId"]
title = video["snippet"]["title"]
published_at = video["snippet"]["publishedAt"]
thumbnail = video["snippet"]["thumbnails"]["high"]["url"]

print("✅ آخر فيديو:")
print("العنوان:", title)
print("الرابط:", f"https://www.youtube.com/watch?v={video_id}")
print("تاريخ النشر:", published_at)
print("صورة مصغرة:", thumbnail)
