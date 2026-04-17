import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock
from App.api.main import app
from App.api.auth import get_current_user_id
from App.api.resume_genetor.routes.route import get_resume_use_case
from App.profile_management.domain.entities.models import GeneratedResume
from datetime import datetime

@pytest.mark.asyncio
async def test_get_resumes_by_job_success():
    # Mock user authentication
    app.dependency_overrides[get_current_user_id] = lambda: "test_user_id"
    
    # Mock ResumeUseCase
    mock_use_case = AsyncMock()
    mock_resume = GeneratedResume(
        id=1,
        user_id="test_user_id",
        title_id=10,
        resume_data={"name": "Test"},
        version=1,
        job_id=20,
        created_at=datetime.utcnow()
    )
    mock_use_case.get_resumes_by_job_id.return_value = [mock_resume]
    app.dependency_overrides[get_resume_use_case] = lambda: mock_use_case

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/resume/job/20")
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["id"] == 1
    assert data[0]["job_id"] == 20
    mock_use_case.get_resumes_by_job_id.assert_called_once_with("test_user_id", 20)
    
    # Clean up overrides
    app.dependency_overrides = {}

@pytest.mark.asyncio
async def test_get_resumes_by_job_not_found():
    # Mock user authentication
    app.dependency_overrides[get_current_user_id] = lambda: "test_user_id"
    
    # Mock ResumeUseCase
    mock_use_case = AsyncMock()
    mock_use_case.get_resumes_by_job_id.side_effect = ValueError("Job not found or unauthorized")
    app.dependency_overrides[get_resume_use_case] = lambda: mock_use_case

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/resume/job/999")
    
    assert response.status_code == 404
    assert response.json()["detail"] == "Job not found or unauthorized"
    
    # Clean up overrides
    app.dependency_overrides = {}
