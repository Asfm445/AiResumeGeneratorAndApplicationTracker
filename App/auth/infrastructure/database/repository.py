from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from App.auth.domain.entities import User, RefreshToken
from App.auth.domain.repository.user_repository import UserRepository
from App.auth.infrastructure.database.schema import DBUser, DBRefreshToken

class SqlAlchemyUserRepository(UserRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_domain(self, db_user: DBUser) -> User:
        user = User(
            id=db_user.id,
            email=db_user.email,
            password_hash=db_user.password_hash,
            first_name=db_user.first_name,
            last_name=db_user.last_name,
            created_at=db_user.created_at,
            verified=db_user.verified,
            roles=list(db_user.roles) if db_user.roles else [],
            tokens=[RefreshToken(
                id=t.id,
                hashed_token=t.hashed_token,
                created_at=t.created_at,
                expire_at=t.expire_at,
                device_ip=t.device_ip
            ) for t in db_user.tokens] if db_user.tokens else []
        )
        return user

    async def save(self, user: User) -> User:
        db_user = DBUser(
            id=user.id,
            email=user.email,
            password_hash=user.password_hash,
            first_name=user.first_name,
            last_name=user.last_name,
            created_at=user.created_at,
            verified=user.verified,
            roles=user.roles
        )
        
        if user.tokens:
            db_user.tokens = [DBRefreshToken(
                id=t.id,
                user_id=user.id,
                hashed_token=t.hashed_token,
                device_ip=t.device_ip,
                created_at=t.created_at,
                expire_at=t.expire_at
            ) for t in user.tokens]
        
        self.session.add(db_user)
        await self.session.commit()
        return user

    async def find_by_email(self, email: str) -> Optional[User]:
        stmt = select(DBUser).options(selectinload(DBUser.tokens)).where(DBUser.email == email)
        result = await self.session.execute(stmt)
        db_user = result.scalar_one_or_none()
        return self._to_domain(db_user) if db_user else None

    async def find_by_id(self, user_id: str) -> Optional[User]:
        stmt = select(DBUser).options(selectinload(DBUser.tokens)).where(DBUser.id == user_id)
        result = await self.session.execute(stmt)
        db_user = result.scalar_one_or_none()
        return self._to_domain(db_user) if db_user else None

    async def update(self, user: User) -> User:
        stmt = select(DBUser).options(selectinload(DBUser.tokens)).where(DBUser.id == user.id)
        result = await self.session.execute(stmt)
        db_user = result.scalar_one_or_none()
        
        if not db_user:
            raise ValueError(f"User {user.id} not found")

        db_user.email = user.email
        db_user.password_hash = user.password_hash
        db_user.first_name = user.first_name
        db_user.last_name = user.last_name
        db_user.verified = user.verified
        db_user.roles = user.roles
        
        # Merge tokens
        # Simply replacing the entirely is easiest for this scope
        db_user.tokens.clear()
        if user.tokens:
            for t in user.tokens:
                db_user.tokens.append(DBRefreshToken(
                    id=t.id,
                    user_id=user.id,
                    hashed_token=t.hashed_token,
                    device_ip=t.device_ip,
                    created_at=t.created_at,
                    expire_at=t.expire_at
                ))
                
        await self.session.commit()
        return user
