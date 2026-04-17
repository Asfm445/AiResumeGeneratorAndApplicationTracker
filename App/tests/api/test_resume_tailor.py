import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock
from App.api.main import app
from App.api.auth import get_current_user_id
from App.api.resume_genetor.routes.route import get_resume_use_case

@pytest.mark.asyncio
async def test_tailor_resume_with_job_id():
    # Mock user authentication
    app.dependency_overrides[get_current_user_id] = lambda: "test_user_id"
    
    # Mock ResumeUseCase
    mock_use_case = AsyncMock()
    mock_use_case.tailor_resume_to_jd.return_value = {"id": 1, "headline": "Tailored Headline"}
    app.dependency_overrides[get_resume_use_case] = lambda: mock_use_case

    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Testing providing only job_id as requested by user
        payload = {"job_id": 123, "title_id": 456}
        response = await ac.post("/api/v1/resume/tailor", json=payload)
    
    assert response.status_code == 200
    assert response.json()["data"]["headline"] == "Tailored Headline"
    
    # Verify it was called with job_id and NOT with separate job details from request
    mock_use_case.tailor_resume_to_jd.assert_called_once_with(
        "test_user_id", None, 456, None, None, 123
    )
    
    # Clean up overrides
    app.dependency_overrides = {}

@pytest.mark.asyncio
async def test_tailor_resume_with_direct_jd():
    # Mock user authentication
    app.dependency_overrides[get_current_user_id] = lambda: "test_user_id"
    
    # Mock ResumeUseCase
    mock_use_case = AsyncMock()
    mock_use_case.tailor_resume_to_jd.return_value = {"id": 2, "headline": "Direct JD Headline"}
    app.dependency_overrides[get_resume_use_case] = lambda: mock_use_case

    async with AsyncClient(app=app, base_url="http://test") as ac:
        payload = {
            "job_description": "We need a Python dev",
            "job_title": "Python Developer",
            "company_name": "Tech Corp",
            "title_id": 456
        }
        response = await ac.post("/api/v1/resume/tailor", json=payload)
    
    assert response.status_code == 200
    assert response.json()["data"]["headline"] == "Direct JD Headline"
    
    mock_use_case.tailor_resume_to_jd.assert_called_once_with(
        "test_user_id", "We need a Python dev", 456, "Python Developer", "Tech Corp", None
    )
    
    # Clean up overrides
    app.dependency_overrides = {}
