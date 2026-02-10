from fastapi import FastAPI
from App.api.routes import route
from App.infrastructure.database.database import engine, Base

# Base.metadata.create_all(bind=engine) # Removed in favor of Alembic

app = FastAPI(title="Profile Service", version="1.0.0")

app.include_router(route.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("App.api.main:app", host="0.0.0.0", port=8000, reload=True)
