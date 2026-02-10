from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime

@dataclass
class UserProfile:
    user_id: str
    name: str
    email: str
    headline: Optional[str] = None
    about_text: Optional[str] = None
    location: Optional[str] = None
    years_of_experience: int = 0
    profile_picture: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    id: Optional[int] = None

@dataclass
class Title:
    title_name: str
    user_id: str
    description: Optional[str] = None
    priority: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    id: Optional[int] = None

@dataclass
class Project:
    user_id: str
    name: str
    short_description: Optional[str] = None
    readme_markdown: Optional[str] = None
    repo_url: Optional[str] = None
    status: str = "active"
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    id: Optional[int] = None

@dataclass
class Tag:
    tag_id: str
    tag_name: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)