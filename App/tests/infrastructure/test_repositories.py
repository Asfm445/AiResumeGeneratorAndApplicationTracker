import pytest
from unittest.mock import AsyncMock, MagicMock
from App.infrastructure.repositories.sql_repositories import SqlAlchemyProfileRepository, SqlAlchemyTitleRepository, SqlAlchemyProjectRepository, SqlAlchemyTagRepository
from App.domain.entities.models import UserProfile, Title, Project, Tag

@pytest.fixture
def mock_session():
    session = AsyncMock()
    session.add = MagicMock()
    return session

@pytest.mark.asyncio
async def test_profile_repo_create_or_update(mock_session):
    repo = SqlAlchemyProfileRepository(mock_session)
    
    # Mock result.scalars().first() -> None (create scenario)
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = None
    mock_session.execute.return_value = mock_result
    
    profile = UserProfile(user_id="u1", name="Test", email="test@test.com")
    
    await repo.create_or_update(profile)
    
    # Verify add called
    mock_session.add.assert_called_once()
    mock_session.commit.assert_called_once()
    mock_session.refresh.assert_called_once()

@pytest.mark.asyncio
async def test_title_repo_create(mock_session):
    repo = SqlAlchemyTitleRepository(mock_session)
    
    title = Title(title_name="T1", user_id="u1")
    
    await repo.create(title)
    
    mock_session.add.assert_called_once()
    mock_session.commit.assert_called_once()

@pytest.mark.asyncio
async def test_project_repo_get_all(mock_session):
    repo = SqlAlchemyProjectRepository(mock_session)
    
    # Mock result.scalars().all()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_session.execute.return_value = mock_result
    
    result = await repo.get_all("u1")
    
    assert result == []
    mock_session.execute.assert_called_once()

@pytest.mark.asyncio
async def test_tag_repo_create(mock_session):
    repo = SqlAlchemyTagRepository(mock_session)
    
    # Mock get_by_name to return None
    repo.get_by_name = AsyncMock(return_value=None)
    
    tag = Tag(tag_id="t1", tag_name="Docker")
    
    await repo.create(tag)
    
    mock_session.add.assert_called_once()
    mock_session.commit.assert_called_once()
