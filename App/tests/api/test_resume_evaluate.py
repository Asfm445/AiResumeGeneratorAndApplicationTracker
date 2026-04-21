import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from App.api.main import app
from App.api.auth import get_current_user_id
from App.api.resume_genetor.routes.route import get_resume_use_case

# Mock data
MOCK_USER_ID = "test-user-id"
MOCK_EVALUATION = {
    "score": 85,
    "summary": "The resume matches the job requirements well, especially in backend development.",
    "strengths": ["Python expertise", "FastAPI experience"],
    "gaps": ["Missing Docker knowledge", "No cloud experience mentioned"],
    "suggestions": ["Add Docker projects", "Mention AWS services used"],
    "ats_score": 90,
    "ats_feedback": ["Standard headers used", "Keywords optimized"]
}

@pytest.fixture
def mock_user():
    app.dependency_overrides[get_current_user_id] = lambda: MOCK_USER_ID
    yield
    app.dependency_overrides.pop(get_current_user_id, None)

@pytest.fixture
def mock_resume_use_case():
    use_case = MagicMock()
    use_case.evaluate_resume = AsyncMock(return_value={
        "id": 1,
        "created_at": "2023-01-01T00:00:00",
        **MOCK_EVALUATION
    })
    app.dependency_overrides[get_resume_use_case] = lambda: use_case
    yield use_case
    app.dependency_overrides.pop(get_resume_use_case, None)

def test_evaluate_resume_endpoint(mock_user, mock_resume_use_case):
    client = TestClient(app)
    response = client.post(
        "/api/v1/resume/evaluate",
        json={"resume_id": 1}
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["score"] == 85
    assert data["summary"] == MOCK_EVALUATION["summary"]
    assert data["strengths"] == MOCK_EVALUATION["strengths"]
    assert data["ats_score"] == 90
    assert data["ats_feedback"] == MOCK_EVALUATION["ats_feedback"]
    assert mock_resume_use_case.evaluate_resume.called
    assert mock_resume_use_case.evaluate_resume.call_args[0][1] == 1 # resume_id
