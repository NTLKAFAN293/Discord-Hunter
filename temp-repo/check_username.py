#!/usr/bin/env python3
import sys
import json
import os

try:
    import requests
    import time
    
    def check_discord_username(username, max_retries=2):
        """Check if Discord username is available"""
        endpoint = "https://discord.com/api/v9"
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        for attempt in range(max_retries):
            try:
                r = requests.post(
                    url=f"{endpoint}/unique-username/username-attempt-unauthed",
                    headers=headers,
                    json={"username": username},
                    timeout=3
                )
                
                if r.status_code in [200, 201, 204]:
                    data = r.json()
                    if not data.get("taken", True):
                        return {"available": True, "username": username}
                    else:
                        return {"available": False, "username": username}
                elif r.status_code == 429:
                    retry_after = min(r.json().get("retry_after", 2), 3)
                    if attempt < max_retries - 1:
                        time.sleep(retry_after)
                        continue
                    return {"available": False, "error": "Rate limited", "username": username}
                else:
                    return {"available": False, "error": f"Status {r.status_code}", "username": username}
                    
            except requests.exceptions.Timeout:
                if attempt < max_retries - 1:
                    continue
                return {"available": False, "error": "Timeout", "username": username}
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    continue
                return {"available": False, "error": str(e), "username": username}
        
        return {"available": False, "error": "Max retries exceeded", "username": username}
    
    if len(sys.argv) > 1:
        username = sys.argv[1]
        result = check_discord_username(username)
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "No username provided", "available": False}))
        
except ImportError as e:
    print(json.dumps({"error": f"Import error: {str(e)}", "available": False}))
except Exception as e:
    print(json.dumps({"error": str(e), "available": False}))