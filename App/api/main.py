from fastapi import FastAPI
from App.api.profile_management.routes import route as profile_route
from App.api.resume_genetor.routes import route as resume_route
from App.api import auth_controller
from App.profile_management.infrastructure.database.database import engine, Base
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

# Base.metadata.create_all(bind=engine) # Removed in favor of Alembic

app = FastAPI(title="Profile Service", version="1.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile_route.router)
app.include_router(resume_route.router)
app.include_router(auth_controller.router)

if __name__ == "__main__":
    uvicorn.run("App.api.main:app", host="0.0.0.0", port=8000, reload=True)
