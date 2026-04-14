import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch
from App.api.main import app
from App.api.auth import get_current_user_id
from App.api.resume_genetor.routes.route import get_resume_use_case

@pytest.mark.asyncio
async def test_delete_resume_success():
    # Mock user authentication
    app.dependency_overrides[get_current_user_id] = lambda: "test_user_id"
    
    # Mock ResumeUseCase
    mock_use_case = AsyncMock()
    mock_use_case.delete_resume.return_value = True
    app.dependency_overrides[get_resume_use_case] = lambda: mock_use_case

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.delete("/api/v1/resume/123")
    
    assert response.status_code == 200
    assert response.json() == {"message": "Resume deleted successfully"}
    mock_use_case.delete_resume.assert_called_once_with("test_user_id", 123)
    
    # Clean up overrides
    app.dependency_overrides = {}

@pytest.mark.asyncio
async def test_delete_resume_not_found():
    # Mock user authentication
    app.dependency_overrides[get_current_user_id] = lambda: "test_user_id"
    
    # Mock ResumeUseCase
    mock_use_case = AsyncMock()
    mock_use_case.delete_resume.return_value = False
    app.dependency_overrides[get_resume_use_case] = lambda: mock_use_case

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.delete("/api/v1/resume/456")
    
    assert response.status_code == 404
    assert response.json()["detail"] == "Resume not found"
    
    # Clean up overrides
    app.dependency_overrides = {}
