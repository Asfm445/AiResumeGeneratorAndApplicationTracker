import pytest
from unittest.mock import AsyncMock
from App.application.use_cases.project_use_cases import CreateProjectUseCase, AttachTitleToProjectUseCase, AttachTagToProjectUseCase
from App.domain.entities.models import Project, Tag

@pytest.fixture
def mock_project_repo():
    return AsyncMock()

@pytest.fixture
def mock_tag_repo():
    return AsyncMock()

@pytest.mark.asyncio
async def test_create_project(mock_project_repo):
    use_case = CreateProjectUseCase(mock_project_repo)
    
    expected_project = Project(
        user_id="user123",
        name="My Project",
        short_description="Description",
        repo_url="http://repo",
        status="active"
    )
    mock_project_repo.create.return_value = expected_project

    result = await use_case.execute(
        user_id="user123",
        name="My Project",
        short_description="Description",
        repo_url="http://repo",
        readme="README",
        status="active"
    )

    assert result == expected_project
    mock_project_repo.create.assert_called_once()

@pytest.mark.asyncio
async def test_attach_titles_to_project(mock_project_repo):
    use_case = AttachTitleToProjectUseCase(mock_project_repo)
    
    # Test with mixed string/int IDs as handled by the use case logic
    await use_case.execute(project_id=1, title_ids=["1", 2, "inf"])
    
    # Logic: "1" -> 1, 2 -> 2, "inf" ignored
    mock_project_repo.attach_titles.assert_called_once_with(1, [1, 2])

@pytest.mark.asyncio
async def test_attach_tags_to_project_existing_tag(mock_project_repo, mock_tag_repo):
    use_case = AttachTagToProjectUseCase(mock_project_repo, mock_tag_repo)
    
    # Mock existing tag
    existing_tag = Tag(tag_id="t1", tag_name="Python")
    mock_tag_repo.get_by_name.return_value = existing_tag
    
    await use_case.execute(project_id=1, tag_names=["Python"])
    
    mock_tag_repo.create.assert_not_called()
    mock_project_repo.attach_tags.assert_called_once_with(1, ["Python"])

@pytest.mark.asyncio
async def test_attach_tags_to_project_new_tag(mock_project_repo, mock_tag_repo):
    use_case = AttachTagToProjectUseCase(mock_project_repo, mock_tag_repo)
    
    # Mock tag missing
    mock_tag_repo.get_by_name.return_value = None
    
    await use_case.execute(project_id=1, tag_names=["Rust"])
    
    mock_tag_repo.create.assert_called_once()
    mock_project_repo.attach_tags.assert_called_once_with(1, ["Rust"])
