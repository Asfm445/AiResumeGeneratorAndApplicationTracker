from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from App.profile_management.infrastructure.database.database import Base
from pgvector.sqlalchemy import Vector

class UserProfile(Base):
    __tablename__ = 'user_profiles'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, unique=True, index=True)  # auth service ID
    email = Column(String(255), nullable=False)

    name = Column(String(255), nullable=False)
    headline = Column(String(255))
    about_text = Column(Text)
    location = Column(String(255))
    years_of_experience = Column(Integer, default=0)
    profile_picture = Column(String(255))

    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)


class Title(Base):
    __tablename__ = 'titles'

    id = Column(Integer, primary_key=True)
    user_id = Column(String(255), nullable=False, index=True)

    title_name = Column(String(255), nullable=False)
    description = Column(Text)
    priority = Column(Integer, default=0)

    created_at = Column(DateTime, nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'title_name'),
    )

class Project(Base):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True)
    user_id = Column(String(255), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    short_description = Column(String(255))
    repo_url = Column(String(255))
    status = Column(String(50), default="active")

    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)

    embeddings = relationship("ProjectEmbedding", back_populates="project", 
                            cascade="all, delete-orphan", lazy="selectin")



class TitleProject(Base):
    __tablename__ = 'title_project'

    title_id = Column(Integer, ForeignKey('titles.id'), primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id'), primary_key=True, index=True)

class Tag(Base):
    __tablename__ = 'tags'

    id = Column(Integer, primary_key=True, index=True)
    tag_name = Column(String(64), unique=True, nullable=False)



class TagProject(Base):
    __tablename__ = 'tag_project'

    tag_id = Column(Integer, ForeignKey('tags.id'), primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id'), primary_key=True, index=True)


class ProjectEmbedding(Base):
    __tablename__ = "project_embeddings"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)

    embedding_type = Column(String(50), nullable=False)
    # "overview", "features", "tech_stack"
    raw_text = Column(Text, nullable=False)

    embedding = Column(Vector(384), nullable=True)

    created_at = Column(DateTime, nullable=False)

    project = relationship("Project", back_populates="embeddings")

    __table_args__ = (
        UniqueConstraint("project_id", "embedding_type"),
    )


class Experience(Base):
    __tablename__ = "experiences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)

    company_name = Column(String(255), nullable=False)
    employement_type = Column(String(50), nullable=False)
    role_title = Column(String(255), nullable=False)
    short_description = Column(Text, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    description_embedding = Column(Vector(384), nullable=True)  # Embedding for short_description

    tech_stack = Column(JSON, nullable=True)  # Store list of strings as JSON

    created_at = Column(DateTime, nullable=False)


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    skill_type = Column(String(255), nullable=False) # e.g. Languages, Backend, Databases
    skills = Column(JSON, nullable=False) # list of skills

    created_at = Column(DateTime, nullable=False)


