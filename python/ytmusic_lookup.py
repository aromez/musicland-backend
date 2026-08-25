import sys
import json
import subprocess
from ytmusicapi import YTMusic

ytmusic = YTMusic()


def get_trending():
    results = ytmusic.get_charts()
    return results


def search(query, filter_type=None):
    results = ytmusic.search(query, filter=filter_type)
    return results


def get_song(video_id):
    return ytmusic.get_song(video_id)


def get_watch_playlist(video_id):
    return ytmusic.get_watch_playlist(video_id)


def get_stream_url(video_id):
    url = f"https://www.youtube.com/watch?v={video_id}"
    result = subprocess.run(
        [sys.executable, "-m", "yt_dlp", "-f", "bestaudio", "-g", url],
        capture_output=True,
        text=True,
        timeout=30
    )
    if result.returncode != 0:
        raise Exception(f"yt-dlp error: {result.stderr}")
    stream_url = result.stdout.strip()
    return {"streamUrl": stream_url}


def get_artist_albums(artist_id):
    artist = ytmusic.get_artist(artist_id)
    albums = artist.get('albums', {}).get('results', [])
    return albums


def get_artist_songs(artist_id):
    artist = ytmusic.get_artist(artist_id)
    songs = artist.get('songs', {}).get('results', [])
    return songs
def get_artist_details(artist_id):
    return ytmusic.get_artist(artist_id)


def get_album_details(album_id):
    return ytmusic.get_album(album_id)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        return

    command = sys.argv[1]

    try:
        if command == "trending":
            result = get_trending()
        elif command == "search":
            query = sys.argv[2] if len(sys.argv) > 2 else ""
            filter_type = sys.argv[3] if len(sys.argv) > 3 else None
            result = search(query, filter_type)
        elif command == "song":
            video_id = sys.argv[2] if len(sys.argv) > 2 else ""
            result = get_song(video_id)
        elif command == "watch_playlist":
            video_id = sys.argv[2] if len(sys.argv) > 2 else ""
            result = get_watch_playlist(video_id)
        elif command == "stream":
            video_id = sys.argv[2] if len(sys.argv) > 2 else ""
            result = get_stream_url(video_id)
        elif command == "artist_albums":
            artist_id = sys.argv[2] if len(sys.argv) > 2 else ""
            result = get_artist_albums(artist_id)
        elif command == "artist_songs":
            artist_id = sys.argv[2] if len(sys.argv) > 2 else ""
            result = get_artist_songs(artist_id)
        elif command == "artist_details":
            artist_id = sys.argv[2] if len(sys.argv) > 2 else ""
            result = get_artist_details(artist_id)
        elif command == "album_details":
            album_id = sys.argv[2] if len(sys.argv) > 2 else ""
            result = get_album_details(album_id)
        else:
            result = {"error": f"Unknown command: {command}"}

        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    main()