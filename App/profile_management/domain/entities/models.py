from dataclasses import dataclass, field
from typing import Optional, List
from datetime import datetime

@dataclass
class UserProfile:
    user_id: str
    name: str
    email: str
    headline: Optional[str] = None
    about_text: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    years_of_experience: int = 0
    profile_picture: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    id: Optional[int] = None

@dataclass
class Education:
    user_id: str
    school: str
    degree: str
    field_of_study: Optional[str] = None
    start_date: datetime = field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None
    relevant_courses: List[str] = field(default_factory=list)
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
class ProjectDescription:
    type: str
    text: str

@dataclass
class Project:
    user_id: str
    name: str
    short_description: Optional[str] = None
    repo_url: Optional[str] = None
    status: str = "active"
    project_description: Optional[List[ProjectDescription]] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    id: Optional[int] = None

@dataclass
class ProjectEmbedding:
    project_id: int
    embedding_type: str
    raw_text: str
    embedding: Optional[List[float]] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    id: Optional[int] = None

@dataclass
class Tag:
    tag_id: str
    tag_name: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


# Company name
# Employment type (Intern / Part-time / Full-time)
# Role/title
# Tech stack
# Short description (5–8 lines, raw text)
# startDate
# EndDate(Optional)


@dataclass 
class Expriance:
    company_name: str
    employement_type: str
    role_title: str
    short_description: str
    start_date: datetime
    user_id: str
    tech_stack: Optional[List[str]] = field(default_factory=list)
    end_date: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    id: Optional[int] = None

@dataclass
class Skill:
    user_id: str
    skill_type: str
    skills: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    id: Optional[int] = None

@dataclass
class Job:
    user_id: str
    job_title: str
    company_name: str
    job_description: str
    url: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    id: Optional[int] = None

@dataclass
class GeneratedResume:
    user_id: str
    resume_data: dict
    version: int
    title_id: Optional[int] = None
    job_id: Optional[int] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    id: Optional[int] = None

@dataclass
class ResumeEvaluation:
    user_id: str
    resume_id: int
    score: int
    summary: str
    job_id: Optional[int] = None
    title_id: Optional[int] = None
    strengths: List[str] = field(default_factory=list)
    gaps: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    ats_score: int = 0
    ats_feedback: List[str] = field(default_factory=list)
    profile_gaps: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    id: Optional[int] = None
