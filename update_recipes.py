import os
import json
import requests
from base64 import b64encode
from youtube_transcript_api import YouTubeTranscriptApi

# =============================
# مفاتيح API
# =============================
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GITHUB_TOKEN = os.environ.get("ITHUB_TOKEN")  # Personal Access Token
GITHUB_REPO = "Mohamed14200/oumwalid"  # ضع هنا user/repo الخاص بك
GITHUB_FILE_PATH = "recipes.json"  # مسار الملف داخل المستودع
GITHUB_BRANCH = "main"  # الفرع الرئيسي

if not YOUTUBE_API_KEY or not GEMINI_API_KEY or not GITHUB_TOKEN:
    print("❌ المفاتيح مفقودة. تأكد من YOUTUBE_API_KEY و GEMINI_API_KEY و GITHUB_TOKEN")
    exit()

# =============================
# جلب آخر فيديو
# =============================
CHANNEL_ID = "UCVXD2kNki3rfLMhF8uNIcBQ"
youtube_url = "https://www.googleapis.com/youtube/v3/search"

params = {
    "key": YOUTUBE_API_KEY,
    "channelId": CHANNEL_ID,
    "part": "snippet",
    "order": "date",
    "maxResults": 1,
    "type": "video"
}

response = requests.get(youtube_url, params=params).json()

if "items" not in response or len(response["items"]) == 0:
    print("❌ لم يتم العثور على فيديوهات")
    exit()

video = response["items"][0]
video_id = video["id"]["videoId"]
title = video["snippet"]["title"]
published_at = video["snippet"]["publishedAt"]
thumbnail = video["snippet"]["thumbnails"]["high"]["url"]

print("✅ آخر فيديو:", title)
print("ENV CHECK:",
      bool(os.environ.get("YOUTUBE_API_KEY")),
      bool(os.environ.get("GEMINI_API_KEY")),
      bool(os.environ.get("GITHUB_TOKEN")))

# =============================
# استخراج Transcript
# =============================
try:
    transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
    transcript_text = " ".join([t['text'] for t in transcript_list])
except Exception as e:
    print("❌ لم أتمكن من الحصول على Transcript:", e)
    exit()

# =============================
# طلب Gemini
# =============================
gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

prompt_text = f"""
أريد منك استخراج وصفة طعام من هذا النص:
{transcript_text}

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

gemini_response = requests.post(
    gemini_url,
    headers={
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json"
    },
    json={"contents":[{"parts":[{"text": prompt_text}]}]}
).json()

try:
    gemini_text = gemini_response["candidates"][0]["content"]["parts"][0]["text"]
    start = gemini_text.find("{")
    end = gemini_text.rfind("}") + 1
    recipe_data = json.loads(gemini_text[start:end])
except Exception as e:
    print("❌ Gemini لم يُرجع JSON صالح:", e)
    exit()

# =============================
# جلب الملف من GitHub
# =============================
github_api_url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{GITHUB_FILE_PATH}?ref={GITHUB_BRANCH}"
headers = {"Authorization": f"token {GITHUB_TOKEN}"}
resp = requests.get(github_api_url, headers=headers).json()

if "content" not in resp:
    print("❌ لم أتمكن من جلب الملف من GitHub")
    exit()

file_sha = resp["sha"]
file_content = b64encode(b64decode(resp["content"])).decode('utf-8')
recipes = json.loads(file_content)

# =============================
# إضافة وصفة جديدة
# =============================
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

# =============================
# رفع الملف إلى GitHub
# =============================
updated_content = b64encode(json.dumps(recipes, ensure_ascii=False, indent=4).encode()).decode()

update_data = {
    "message": f"تحديث الوصفة: {title}",
    "content": updated_content,
    "sha": file_sha,
    "branch": GITHUB_BRANCH
}

update_resp = requests.put(github_api_url, headers=headers, json=update_data).json()

if "content" in update_resp:
    print("✅ تم تحديث recipes.json على GitHub!")
else:
    print("❌ فشل التحديث:", update_resp)
