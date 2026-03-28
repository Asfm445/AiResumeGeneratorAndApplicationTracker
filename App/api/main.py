from fastapi import FastAPI
from App.api.profile_management.routes import route
from App.profile_management.infrastructure.database.database import engine, Base
import uvicorn

# Base.metadata.create_all(bind=engine) # Removed in favor of Alembic

app = FastAPI(title="Profile Service", version="1.0.0")

app.include_router(route.router)

if __name__ == "__main__":
    uvicorn.run("App.api.main:app", host="0.0.0.0", port=8000, reload=True)
