import pytest
from unittest.mock import AsyncMock, MagicMock
from App.api.controllers.profile_controller import ProfileController, ProfileUpdate, TitleCreate, ProjectCreate, TagCreate, ProfileResponse, TitleResponse, ProjectResponse, TagResponse
from App.domain.entities.models import UserProfile, Title, Project, Tag
from datetime import datetime

@pytest.fixture
def mock_db():
    return AsyncMock()

@pytest.fixture
def profile_controller(mock_db):
    controller = ProfileController(mock_db)
    # Patch the use cases on the instance
    controller.create_profile_uc = AsyncMock()
    controller.get_profile_uc = AsyncMock()
    controller.create_title_uc = AsyncMock()
    controller.list_titles_uc = AsyncMock()
    controller.create_project_uc = AsyncMock()
    controller.attach_titles_uc = AsyncMock()
    controller.create_tag_uc = AsyncMock()
    controller.attach_tags_uc = AsyncMock()
    return controller

@pytest.mark.asyncio
async def test_create_or_update_profile(profile_controller):
    data = ProfileUpdate(
        fullName="Test User",
        headline="Dev",
        bio="Bio",
        location="Earth",
        yearsOfExperience=5
    )
    
    mock_profile = UserProfile(user_id="u1", name="Test User", email="", headline="Dev", about_text="Bio", location="Earth", years_of_experience=5, id=1, created_at=datetime.utcnow(), updated_at=datetime.utcnow())
    profile_controller.create_profile_uc.execute.return_value = mock_profile
    
    response = await profile_controller.create_or_update_profile("u1", data)

    assert isinstance(response, ProfileResponse)
    assert response.fullName == "Test User"
    profile_controller.create_profile_uc.execute.assert_called_once()

@pytest.mark.asyncio
async def test_get_profile_found(profile_controller):
    mock_profile = UserProfile(user_id="u1", name="Test User", email="", headline="Dev", about_text="Bio", location="Earth", years_of_experience=5, id=1, created_at=datetime.utcnow(), updated_at=datetime.utcnow())
    profile_controller.get_profile_uc.execute.return_value = mock_profile
    
    response = await profile_controller.get_profile("u1")
    
    assert isinstance(response, ProfileResponse)
    assert response.userId == "u1"

@pytest.mark.asyncio
async def test_get_profile_not_found(profile_controller):
    profile_controller.get_profile_uc.execute.return_value = None
    
    response = await profile_controller.get_profile("u1")
    
    assert response is None

@pytest.mark.asyncio
async def test_create_title(profile_controller):
    data = TitleCreate(name="T1", priority=1)
    
    mock_title = Title(title_name="T1", user_id="u1", priority=1, id=1, created_at=None)
    profile_controller.create_title_uc.execute.return_value = mock_title
    
    response = await profile_controller.create_title("u1", data)
    
    assert isinstance(response, TitleResponse)
    assert response.name == "T1"

@pytest.mark.asyncio
async def test_create_project(profile_controller):
    data = ProjectCreate(name="P1", shortDescription="Desc", repoUrl="url", readme="rm", status="active")
    
    mock_project = Project(user_id="u1", name="P1", short_description="Desc", readme_markdown="rm", repo_url="url", status="active", id=1, created_at=None, updated_at=None)
    profile_controller.create_project_uc.execute.return_value = mock_project
    
    response = await profile_controller.create_project("u1", data)
    
    assert isinstance(response, ProjectResponse)
    assert response.name == "P1"
