import pytest
from unittest.mock import AsyncMock, MagicMock
from App.application.use_cases.profile_use_cases import CreateOrUpdateProfileUseCase, GetProfileUseCase
from App.domain.entities.models import UserProfile # Correct import path based on previous exploration

@pytest.fixture
def mock_profile_repo():
    return AsyncMock()

@pytest.mark.asyncio
async def test_create_or_update_profile(mock_profile_repo):
    use_case = CreateOrUpdateProfileUseCase(mock_profile_repo)
    
    expected_profile = UserProfile(
        user_id="user123",
        name="Test User",
        email="",
        headline="Developer",
        about_text="Bio",
        location="Earth",
        years_of_experience=5,
        id=1
    )
    mock_profile_repo.create_or_update.return_value = expected_profile

    result = await use_case.execute(
        user_id="user123",
        name="Test User",
        headline="Developer",
        bio="Bio",
        location="Earth",
        years=5
    )

    assert result == expected_profile
    mock_profile_repo.create_or_update.assert_called_once()
    args, _ = mock_profile_repo.create_or_update.call_args
    assert args[0].user_id == "user123"
    assert args[0].name == "Test User"

@pytest.mark.asyncio
async def test_get_profile(mock_profile_repo):
    use_case = GetProfileUseCase(mock_profile_repo)
    
    expected_profile = UserProfile(user_id="user123", name="Test User", email="test@example.com")
    mock_profile_repo.get_by_user_id.return_value = expected_profile

    result = await use_case.execute("user123")
    
    assert result == expected_profile
    mock_profile_repo.get_by_user_id.assert_called_once_with("user123")
