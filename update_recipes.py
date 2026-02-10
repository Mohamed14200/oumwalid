import os
import requests

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

video = data["items"][0]
video_id = video["id"]["videoId"]
title = video["snippet"]["title"]
published_at = video["snippet"]["publishedAt"]

print("✅ آخر فيديو:")
print("العنوان:", title)
print("الرابط:", f"https://www.youtube.com/watch?v={video_id}")
print("تاريخ النشر:", published_at)
