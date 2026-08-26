import json
from ytmusicapi import YTMusic

ytmusic = YTMusic()
charts = ytmusic.get_charts()
print("Keys:", list(charts.keys()))
print("Full response:")
print(json.dumps(charts, indent=2)[:500])
