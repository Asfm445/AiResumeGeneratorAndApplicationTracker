from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional

@dataclass
class VerificationToken:
    hashed_token: str
    created_at: datetime
    expire_at: datetime

@dataclass
class RefreshToken:
    id: str  # e.g., uuid
    hashed_token: str
    created_at: datetime
    expire_at: datetime
    device_ip: str

@dataclass
class User:
    id: str
    email: str
    password_hash: str
    first_name: str
    last_name: str
    created_at: datetime
    verified: bool = False
    roles: List[str] = field(default_factory=lambda: ["buyer"])
    verification_token: Optional[VerificationToken] = None
    tokens: List[RefreshToken] = field(default_factory=list)
