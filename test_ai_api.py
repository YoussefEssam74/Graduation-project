import requests
import json
import os

# Configuration - loaded at runtime
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5025/api")
REQUEST_TIMEOUT = int(os.getenv("API_REQUEST_TIMEOUT", "30"))  # seconds


def get_headers():
    """Get request headers with authorization token."""
    token = os.getenv("API_TOKEN")
    if not token:
        raise ValueError("API_TOKEN environment variable is required. Please set it before running tests.")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }


def test_endpoint(method, url, data=None, headers=None):
    """Test an endpoint with proper timeout and error handling."""
    print(f"Testing {method} {url}...")
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        else:
            response = requests.post(url, headers=headers, json=data, timeout=REQUEST_TIMEOUT)
        
        # Raise exception for HTTP errors
        response.raise_for_status()
        
        print(f"Status Code: {response.status_code}")
        try:
            print(json.dumps(response.json(), indent=2))
        except ValueError:
            print(response.text[:500])  # Limit output for non-JSON responses
        print("-" * 20)
        return response
        
    except requests.exceptions.Timeout:
        print(f"Error: Request timed out after {REQUEST_TIMEOUT} seconds")
        raise
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        raise


def main():
    """Main entry point - validates configuration and runs tests."""
    try:
        headers = get_headers()
    except ValueError as e:
        print(f"Configuration error: {e}")
        return 1
    
    # 1. Test AI Context
    test_endpoint("GET", f"{BASE_URL}/users/1/ai-context", headers=headers)
    
    # 2. Test User Metrics
    test_endpoint("GET", f"{BASE_URL}/users/1/metrics", headers=headers)
    
    # 3. Test Gemini Chat
    chat_data = {
        "userId": 1,
        "message": "Hello, I want to start a strength training program. Can you give me some advice?"
    }
    test_endpoint("POST", f"{BASE_URL}/ai/gemini-chat", chat_data, headers=headers)
    
    return 0


if __name__ == "__main__":
    exit(main())
