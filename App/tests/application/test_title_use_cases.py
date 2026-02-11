import pytest
from unittest.mock import AsyncMock
from App.application.use_cases.title_use_cases import CreateTitleUseCase, ListTitlesUseCase
from App.domain.entities.models import Title

@pytest.fixture
def mock_title_repo():
    return AsyncMock()

@pytest.mark.asyncio
async def test_create_title(mock_title_repo):
    use_case = CreateTitleUseCase(mock_title_repo)
    
    expected_title = Title(title_name="Dev", user_id="u1", priority=1)
    mock_title_repo.create.return_value = expected_title
    
    result = await use_case.execute(user_id="u1", name="Dev", priority=1)
    
    assert result == expected_title
    mock_title_repo.create.assert_called_once()

@pytest.mark.asyncio
async def test_list_titles(mock_title_repo):
    use_case = ListTitlesUseCase(mock_title_repo)
    
    expected_titles = [Title(title_name="Dev", user_id="u1")]
    mock_title_repo.get_all.return_value = expected_titles
    
    result = await use_case.execute(user_id="u1")
    
    assert result == expected_titles
    mock_title_repo.get_all.assert_called_once_with("u1")
