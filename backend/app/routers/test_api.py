import requests

url = "http://localhost:8000/admin/works?status=draft"
headers = {"X-ADMIN-TOKEN": "tokengue1234567890"}

response = requests.get(url, headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")