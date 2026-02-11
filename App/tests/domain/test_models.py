import pytest
from datetime import datetime
from App.domain.entities.models import UserProfile, Title, Project, Tag

def test_user_profile_initialization():
    profile = UserProfile(
        user_id="user123",
        name="John Doe",
        email="john@example.com",
        headline="Software Engineer",
        about_text="Passionate developer",
        location="New York",
        years_of_experience=5
    )
    
    assert profile.user_id == "user123"
    assert profile.name == "John Doe"
    assert profile.email == "john@example.com"
    assert profile.headline == "Software Engineer"
    assert profile.about_text == "Passionate developer"
    assert profile.location == "New York"
    assert profile.years_of_experience == 5
    assert isinstance(profile.created_at, datetime)
    assert isinstance(profile.updated_at, datetime)
    assert profile.id is None

def test_title_initialization():
    title = Title(
        title_name="Backend Developer",
        user_id="user123",
        priority=1
    )
    
    assert title.title_name == "Backend Developer"
    assert title.user_id == "user123"
    assert title.priority == 1
    assert isinstance(title.created_at, datetime)
    assert title.updated_at is None
    assert title.id is None

def test_project_initialization():
    project = Project(
        user_id="user123",
        name="Resume Generator",
        short_description="AI powered resume generator",
        repo_url="http://github.com/example/repo",
        status="active"
    )

    assert project.user_id == "user123"
    assert project.name == "Resume Generator"
    assert project.short_description == "AI powered resume generator"
    assert project.repo_url == "http://github.com/example/repo"
    assert project.status == "active"
    assert isinstance(project.created_at, datetime)
    assert isinstance(project.updated_at, datetime)
    assert project.id is None

def test_tag_initialization():
    tag = Tag(
        tag_id="tag1",
        tag_name="Python"
    )
    
    assert tag.tag_id == "tag1"
    assert tag.tag_name == "Python"
    assert isinstance(tag.created_at, datetime)
    assert isinstance(tag.updated_at, datetime)
