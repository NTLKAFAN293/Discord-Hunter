
#!/usr/bin/env python3
import sys
import json
import os
import random

try:
    import requests
    import time
    
    # قائمة البروكسيات - أضف بروكسياتك هنا
    # مثال: "ip:port" أو "username:password@ip:port"
    PROXIES_LIST = [
        # أضف بروكسياتك هنا بهذا الشكل:
        # "47.88.62.42:80",
        # "user:pass@proxy.example.com:8080",
    ]
    
    def check_discord_username(username, max_retries=1):
        """Check if Discord username is available"""
        endpoint = "https://discord.com/api/v9"
        
        # تنويع User-Agent
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        ]
        
        headers = {
            "Content-Type": "application/json",
            "User-Agent": random.choice(user_agents)
        }
        
        # اختيار بروكسي عشوائي إذا كانت القائمة غير فارغة
        proxy_dict = None
        if PROXIES_LIST:
            proxy = random.choice(PROXIES_LIST)
            proxy_dict = {
                "http": f"http://{proxy}",
                "https": f"http://{proxy}"
            }
        
        for attempt in range(max_retries):
            try:
                r = requests.post(
                    url=f"{endpoint}/unique-username/username-attempt-unauthed",
                    headers=headers,
                    json={"username": username},
                    timeout=8,
                    proxies=proxy_dict
                )
                
                if r.status_code in [200, 201, 204]:
                    data = r.json()
                    if not data.get("taken", True):
                        return {"available": True, "username": username}
                    else:
                        return {"available": False, "username": username}
                elif r.status_code == 429:
                    return {"available": False, "error": "Rate limited", "username": username}
                else:
                    return {"available": False, "error": f"Status {r.status_code}", "username": username}
                    
            except requests.exceptions.Timeout:
                return {"available": False, "error": "Timeout", "username": username}
            except requests.exceptions.ProxyError:
                return {"available": False, "error": "Proxy failed", "username": username}
            except requests.exceptions.RequestException as e:
                return {"available": False, "error": str(e), "username": username}
        
        return {"available": False, "error": "Check failed", "username": username}
    
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
