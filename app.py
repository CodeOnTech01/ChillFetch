import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
# Enable CORS so your frontend can communicate with this API
CORS(app)

# Domain Validation Regex for the 7 specified platforms
ALLOWED_DOMAINS_REGEX = re.compile(
    r'^https?://(www\.|vm\.|vt\.|mobile\.|m\.)?('
    r'youtube\.com|youtu\.be|'
    r'instagram\.com|'
    r'tiktok\.com|'
    r'reddit\.com|v\.redd\.it|'
    r'facebook\.com|fb\.watch|'
    r'twitter\.com|x\.com|'
    r'pinterest\.com|pin\.it'
    r')/', re.IGNORECASE
)


@app.route('/api/fetch', methods=['POST'])
def fetch_video():
    data = request.json or {}
    url = data.get('url', '').strip()

    # 1. Reject if no URL provided or domain isn't in the allowed 7 platforms
    if not url or not ALLOWED_DOMAINS_REGEX.search(url):
        return jsonify({
            'success': False,
            'message': 'Only video links from YouTube, Instagram, TikTok, Reddit, Facebook, X (Twitter), and Pinterest are supported.'
        }), 400

    # 2. Configure yt-dlp to inspect media with alternative YouTube clients to bypass extraction blocks
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'extract_flat': False,
        'extractor_args': {
            'youtube': {
                'player_client': ['ios', 'android', 'tv_simply', 'mweb']
            }
        }
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            if not info:
                return jsonify({
                    'success': False,
                    'message': 'Unable to process video details.'
                }), 400

            # 3. Check if the link contains a valid video stream
            formats = info.get('formats', [])
            has_video = (
                any(f.get('vcodec') != 'none' for f in formats) 
                or info.get('vcodec') != 'none' 
                or info.get('_type') == 'video'
            )

            if not has_video:
                return jsonify({
                    'success': False,
                    'message': 'The provided link does not contain a valid video file.'
                }), 400

            # Find best direct video URL
            download_url = info.get('url')
            if not download_url and formats:
                # Filter for combined formats or fallback to last format
                video_formats = [f for f in formats if f.get('vcodec') != 'none']
                target = video_formats[-1] if video_formats else formats[-1]
                download_url = target.get('url')

            return jsonify({
                'success': True,
                'title': info.get('title', 'Video Download'),
                'download_url': download_url
            })

    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e).lower()

        # 4. Handle Private / Restricted / Login-required Content
        private_keywords = [
            'private', 
            'login', 
            'permission', 
            'requires authentication', 
            'not available',
            'this video is private',
            'account is private'
        ]

        if any(keyword in error_msg for keyword in private_keywords):
            return jsonify({
                'success': False,
                'message': 'This video or account is private/restricted and cannot be downloaded.'
            }), 403

        # Generic extraction failure
        return jsonify({
            'success': False,
            'message': 'Failed to fetch video. Please check the link and try again.'
        }), 400

    except Exception:
        return jsonify({
            'success': False,
            'message': 'An unexpected server error occurred.'
        }), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
