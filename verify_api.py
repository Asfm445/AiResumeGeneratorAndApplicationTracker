from fastapi.testclient import TestClient
from App.api.main import app
import json

client = TestClient(app)

def test_profile_api():
    print("Testing Profile API...")
    
    # 1. Update Profile
    profile_data = {
        "fullName": "Awel Abubekar",
        "headline": "Backend Engineer",
        "bio": "Backend-focused engineer...",
        "location": "Ethiopia",
        "yearsOfExperience": 2
    }
    response = client.put(
        "/api/v1/profile/", 
        json=profile_data,
        headers={"Authorization": "Bearer token123"}
    )
    print(f"PUT /profile: {response.status_code}")
    print(response.json())
    assert response.status_code == 200
    
    # 2. Get Profile
    response = client.get(
        "/api/v1/profile/me",
         headers={"Authorization": "Bearer token123"}
    )
    print(f"GET /profile/me: {response.status_code}")
    print(response.json())
    assert response.status_code == 200

    # 3. Create Title
    title_data = {
        "name": "Backend Engineer",
        "priority": 1
    }
    response = client.post(
        "/api/v1/profile/titles",
        json=title_data,
         headers={"Authorization": "Bearer token123"}
    )
    print(f"POST /titles: {response.status_code}")
    print(response.json())
    assert response.status_code == 200
    title_id = response.json().get("id")

    # 4. List Titles
    response = client.get(
        "/api/v1/profile/titles",
         headers={"Authorization": "Bearer token123"}
    )
    print(f"GET /titles: {response.status_code}")
    print(response.json())
    assert response.status_code == 200

    # 5. Create Project
    project_data = {
        "name": "Task Manager Backend",
        "shortDescription": "Clean-architecture task management system",
        "repoUrl": "https://github.com/awel/task-manager",
        "readme": "Long README content here...",
        "status": "completed"
    }
    response = client.post(
        "/api/v1/profile/projects",
        json=project_data,
         headers={"Authorization": "Bearer token123"}
    )
    print(f"POST /projects: {response.status_code}")
    print(response.json())
    assert response.status_code == 200
    project_id = response.json().get("id")

    # 6. Attach Title to Project
    attach_data = {
        "titleIds": [title_id]
    }
    response = client.post(
        f"/api/v1/profile/projects/{project_id}/titles",
        json=attach_data,
         headers={"Authorization": "Bearer token123"}
    )
    print(f"POST /projects/{project_id}/titles: {response.status_code}")
    print(response.json())
    assert response.status_code == 200

    # 7. Create Tag
    tag_data = {
        "name": "distributed-systems"
    }
    response = client.post(
        "/api/v1/profile/tags",
        json=tag_data,
         headers={"Authorization": "Bearer token123"}
    )
    print(f"POST /tags: {response.status_code}")
    print(response.json())
    assert response.status_code == 200

    # 8. Attach Tag to Project
    tag_attach_data = {
        "tags": ["distributed-systems", "python"]
    }
    response = client.post(
        f"/api/v1/profile/projects/{project_id}/tags",
        json=tag_attach_data,
         headers={"Authorization": "Bearer token123"}
    )
    print(f"POST /projects/{project_id}/tags: {response.status_code}")
    print(response.json())
    assert response.status_code == 200

if __name__ == "__main__":
    test_profile_api()
