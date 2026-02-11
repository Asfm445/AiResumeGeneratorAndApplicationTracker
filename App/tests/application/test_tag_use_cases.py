import pytest
from unittest.mock import AsyncMock
from App.application.use_cases.tag_use_cases import CreateTagUseCase
from App.domain.entities.models import Tag

@pytest.fixture
def mock_tag_repo():
    return AsyncMock()

@pytest.mark.asyncio
async def test_create_tag(mock_tag_repo):
    use_case = CreateTagUseCase(mock_tag_repo)
    
    expected_tag = Tag(tag_id="t1", tag_name="Docker")
    mock_tag_repo.create.return_value = expected_tag
    
    result = await use_case.execute(name="Docker")
    
    assert result == expected_tag
    mock_tag_repo.create.assert_called_once()
