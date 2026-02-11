import sys
from os.path import dirname, abspath
import pytest

# Add the project root directory to the python path
sys.path.append(dirname(dirname(abspath(__file__))))

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
