import sys
import json
import subprocess
from ytmusicapi import YTMusic
import time

ytmusic = YTMusic()

def get_trending(limit=10):
    """Get trending songs"""
    try:
        charts = ytmusic.get_charts()
        songs = []
        
        # Try different data structures
        if 'trending' in charts:
            trending_data = charts['trending']
            if isinstance(trending_data, dict) and 'results' in trending_data:
                songs = trending_data['results']
            elif isinstance(trending_data, list):
                songs = trending_data
        
        if not songs and 'songs' in charts:
            songs = charts['songs']
        
        # If no songs, use search as fallback
        if not songs:
            search_results = ytmusic.search("top songs", limit=limit)
            if search_results:
                songs = search_results
        
        # Format response
        formatted_songs = []
        for item in songs[:limit]:
            song = {
                'id': item.get('videoId', ''),
                'title': item.get('title', 'Unknown'),
                'artist': item.get('artist', {}).get('name', 'Unknown') if isinstance(item.get('artist'), dict) else str(item.get('artist', 'Unknown')),
                'artistId': item.get('artist', {}).get('id', '') if isinstance(item.get('artist'), dict) else '',
                'coverUrl': item.get('thumbnails', [{}])[-1].get('url', '') if item.get('thumbnails') else '',
                'albumId': item.get('album', {}).get('id', '') if isinstance(item.get('album'), dict) else '',
                'durationSec': 0,
                'genre': 'all',
                'isDownloaded': False,
                'isLiked': False
            }
            formatted_songs.append(song)
        
        return {'songs': formatted_songs}
    except Exception as e:
        return {'error': f'Failed to get trending: {str(e)}'}

def search(query, filter_type=None, limit=10):
    """Search with limit - Fixed filter handling"""
    try:
        valid_filters = ['albums', 'artists', 'playlists', 'community_playlists', 
                        'featured_playlists', 'songs', 'videos', 'profiles', 
                        'podcasts', 'episodes']
        
        # Only use filter if valid
        if filter_type and filter_type in valid_filters:
            results = ytmusic.search(query, filter=filter_type, limit=limit)
        else:
            results = ytmusic.search(query, limit=limit)
        
        # Format results
        formatted_results = []
        for item in results:
            formatted_item = {
                'id': item.get('videoId', ''),
                'title': item.get('title', 'Unknown'),
                'artist': item.get('artist', {}).get('name', 'Unknown') if isinstance(item.get('artist'), dict) else str(item.get('artist', 'Unknown')),
                'artistId': item.get('artist', {}).get('id', '') if isinstance(item.get('artist'), dict) else '',
                'coverUrl': item.get('thumbnails', [{}])[-1].get('url', '') if item.get('thumbnails') else '',
                'albumId': item.get('album', {}).get('id', '') if isinstance(item.get('album'), dict) else '',
                'durationSec': 0,
                'genre': 'all',
                'isDownloaded': False,
                'isLiked': False
            }
            formatted_results.append(formatted_item)
        
        return {'songs': formatted_results}
    except Exception as e:
        return {'error': f'Search failed: {str(e)}'}

def get_song(video_id):
    try:
        return ytmusic.get_song(video_id)
    except Exception as e:
        return {'error': f'Failed to get song: {str(e)}'}

def get_watch_playlist(video_id):
    try:
        return ytmusic.get_watch_playlist(video_id)
    except Exception as e:
        return {'error': f'Failed to get playlist: {str(e)}'}

def get_stream_url(video_id):
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        result = subprocess.run(
            [sys.executable, "-m", "yt_dlp", "-f", "bestaudio", "-g", url],
            capture_output=True,
            text=True,
            timeout=20
        )
        if result.returncode != 0:
            raise Exception(f"yt-dlp error: {result.stderr}")
        stream_url = result.stdout.strip()
        return {"streamUrl": stream_url}
    except subprocess.TimeoutExpired:
        return {"error": "Stream URL fetch timed out"}
    except Exception as e:
        return {"error": f"Stream fetch failed: {str(e)}"}

def get_artist_albums(artist_id, limit=10):
    try:
        artist = ytmusic.get_artist(artist_id)
        albums = artist.get('albums', {}).get('results', [])[:limit]
        return {'albums': albums}
    except Exception as e:
        return {'error': f'Failed to get artist albums: {str(e)}'}

def get_artist_songs(artist_id, limit=20):
    try:
        artist = ytmusic.get_artist(artist_id)
        songs = artist.get('songs', {}).get('results', [])[:limit]
        return {'songs': songs}
    except Exception as e:
        return {'error': f'Failed to get artist songs: {str(e)}'}

def get_artist_details(artist_id):
    try:
        return ytmusic.get_artist(artist_id)
    except Exception as e:
        return {'error': f'Failed to get artist details: {str(e)}'}

def get_album_details(album_id):
    try:
        return ytmusic.get_album(album_id)
    except Exception as e:
        return {'error': f'Failed to get album details: {str(e)}'}

def get_recommended(limit=10):
    """Get recommended songs"""
    try:
        result = get_trending(limit)
        if result.get('songs'):
            return result
        
        # Fallback: search for popular music
        search_results = ytmusic.search("popular music", limit=limit)
        if search_results:
            songs = []
            for item in search_results[:limit]:
                song = {
                    'id': item.get('videoId', ''),
                    'title': item.get('title', 'Unknown'),
                    'artist': item.get('artist', {}).get('name', 'Unknown') if isinstance(item.get('artist'), dict) else str(item.get('artist', 'Unknown')),
                    'artistId': item.get('artist', {}).get('id', '') if isinstance(item.get('artist'), dict) else '',
                    'coverUrl': item.get('thumbnails', [{}])[-1].get('url', '') if item.get('thumbnails') else '',
                    'albumId': '',
                    'durationSec': 0,
                    'genre': 'all',
                    'isDownloaded': False,
                    'isLiked': False
                }
                songs.append(song)
            return {'songs': songs}
        
        return {'songs': []}
    except Exception as e:
        return {'error': f'Failed to get recommendations: {str(e)}'}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        return

    command = sys.argv[1]
    args = sys.argv[2:]

    try:
        start_time = time.time()
        result = None

        if command == "trending":
            limit = int(args[0]) if args else 20
            result = get_trending(limit)
            
        elif command == "recommended":
            limit = int(args[0]) if args else 10
            result = get_recommended(limit)
            
        elif command == "search":
            query = args[0] if len(args) > 0 else ""
            filter_type = args[1] if len(args) > 1 else None
            limit = int(args[2]) if len(args) > 2 else 10
            result = search(query, filter_type, limit)
            
        elif command == "song":
            video_id = args[0] if len(args) > 0 else ""
            result = get_song(video_id)
            
        elif command == "watch_playlist":
            video_id = args[0] if len(args) > 0 else ""
            result = get_watch_playlist(video_id)
            
        elif command == "stream":
            video_id = args[0] if len(args) > 0 else ""
            result = get_stream_url(video_id)
            
        elif command == "artist_albums":
            artist_id = args[0] if len(args) > 0 else ""
            limit = int(args[1]) if len(args) > 1 else 10
            result = get_artist_albums(artist_id, limit)
            
        elif command == "artist_songs":
            artist_id = args[0] if len(args) > 0 else ""
            limit = int(args[1]) if len(args) > 1 else 20
            result = get_artist_songs(artist_id, limit)
            
        elif command == "artist_details":
            artist_id = args[0] if len(args) > 0 else ""
            result = get_artist_details(artist_id)
            
        elif command == "album_details":
            album_id = args[0] if len(args) > 0 else ""
            result = get_album_details(album_id)
            
        else:
            result = {"error": f"Unknown command: {command}"}

        elapsed = time.time() - start_time
        if result and 'error' not in result:
            result['_executionTime'] = f"{elapsed:.2f}s"

        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": f"Script error: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()