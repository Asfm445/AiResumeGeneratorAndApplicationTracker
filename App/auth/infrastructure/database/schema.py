from sqlalchemy import Column, String, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from App.profile_management.infrastructure.database.database import Base

class DBUser(Base):
    __tablename__ = 'users'

    id = Column(String(255), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False)
    verified = Column(Boolean, default=False)
    roles = Column(JSON, nullable=False)

    tokens = relationship("DBRefreshToken", back_populates="user", cascade="all, delete-orphan")


class DBRefreshToken(Base):
    __tablename__ = 'refresh_tokens'

    id = Column(String(255), primary_key=True)
    user_id = Column(String(255), ForeignKey('users.id'), index=True)
    hashed_token = Column(String(255), nullable=False)
    device_ip = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False)
    expire_at = Column(DateTime, nullable=False)

    user = relationship("DBUser", back_populates="tokens")
