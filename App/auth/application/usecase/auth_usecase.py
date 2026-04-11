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

    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        try:
            payload = JWTService.decode_token(refresh_token)
            user_id = payload.get("sub")
            if not user_id:
                raise ValueError("Invalid refresh token: missing sub")
        except Exception:
            raise ValueError("Invalid refresh token")

        user = await self.user_repo.find_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        import hashlib
        hashed_rt = hashlib.sha256(refresh_token.encode('utf-8')).hexdigest()
        
        # Check if the token exists and is not expired
        token_found = False
        current_time = datetime.now(timezone.utc).replace(tzinfo=None) # naive comparison since repo uses naive

        valid_tokens = []
        for t in user.tokens:
            if t.hashed_token == hashed_rt:
                if t.expire_at > current_time:
                    token_found = True
                    valid_tokens.append(t)
                # else: don't add to valid_tokens (this deletes the expired token later)
            elif t.expire_at > current_time:
                valid_tokens.append(t)
        
        if not token_found:
            raise ValueError("Refresh token invalid or expired")

        # Refresh Token Rotation:
        # 1. Remove the used token (it's not in valid_tokens if we don't re-add it)
        # 2. Generate new refresh token
        new_refresh_token_jwt = JWTService.create_refresh_token({"sub": user.id})
        new_hashed_rt = hashlib.sha256(new_refresh_token_jwt.encode('utf-8')).hexdigest()
        
        expire_at = datetime.utcnow() + timedelta(days=7)
        new_rt = RefreshToken(
            id=str(uuid.uuid4()),
            hashed_token=new_hashed_rt,
            created_at=datetime.utcnow(),
            expire_at=expire_at,
            device_ip=user.tokens[0].device_ip if user.tokens else ""
        )
        
        valid_tokens.append(new_rt)
        user.tokens = valid_tokens
        await self.user_repo.update(user)

        # Generate new access token
        access_token_data = {"sub": user.id, "roles": user.roles}
        access_token = JWTService.create_access_token(access_token_data)

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token_jwt,
            "token_type": "bearer"
        }
