from datetime import datetime, timezone, timedelta
import uuid
from typing import Optional, Dict, Any
from App.auth.domain.entities import User, RefreshToken
from App.auth.domain.repository.user_repository import UserRepository
from App.auth.infrastructure.services.password_service import PasswordService
from App.auth.infrastructure.services.jwt_service import JWTService

class AuthUseCase:
    def __init__(self, user_repository: UserRepository):
        self.user_repo = user_repository

    async def register(self, email: str, password: str, first_name: str, last_name: str) -> Dict[str, Any]:
        existing_user = await self.user_repo.find_by_email(email)
        if existing_user:
            raise ValueError("Email already exists")

        # Generate a unique ID for the user natively (matching String(255) in schema)
        user_id = str(uuid.uuid4())
        password_hash = PasswordService.get_password_hash(password)
        
        new_user = User(
            id=user_id,
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            created_at=datetime.utcnow(),
            roles=["buyer"],
            verified=False
        )
        
        await self.user_repo.save(new_user)
        return {"message": "User registered successfully."}

    async def login(self, email: str, password: str, device_ip: Optional[str] = None) -> Dict[str, Any]:
        user = await self.user_repo.find_by_email(email)
        if not user or not PasswordService.verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials")

        # Generate tokens
        access_token_data = {"sub": user.id, "roles": user.roles}
        access_token = JWTService.create_access_token(access_token_data)

        refresh_token_data = {"sub": user.id}
        refresh_token_jwt = JWTService.create_refresh_token(refresh_token_data)
        
        import hashlib
        hashed_rt = hashlib.sha256(refresh_token_jwt.encode('utf-8')).hexdigest()
        rt_id = str(uuid.uuid4())
        
        # 7 days roughly
        expire_at = datetime.utcnow() + timedelta(days=7)

        new_rt = RefreshToken(
            id=rt_id,
            hashed_token=hashed_rt,
            created_at=datetime.utcnow(),
            expire_at=expire_at,
            device_ip=device_ip or ""
        )
        
        user.tokens.append(new_rt)
        await self.user_repo.update(user)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_jwt,
            "token_type": "bearer"
        }

    async def get_me(self, user_id: str) -> Optional[User]:
        return await self.user_repo.find_by_id(user_id)
