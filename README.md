# AI Resume Generator and Application Tracker

An AI-powered full-stack web application designed to help users manage their professional profiles, track job applications, and semantically tailor resumes to specific job descriptions using Google Gemini LLMs and vector search.

---

## Architecture Overview

The project is structured as a multi-service application managed using Docker Compose:

1.  **FastAPI Backend (`/App`)**:
    *   Implements **Domain-Driven Design (DDD) / Clean Architecture** principles.
    *   Exposes APIs for user authentication (JWT), profile management (experiences, projects, skills, education, job titles), and AI resume tailoring.
    *   Publishes embedding tasks to a **Redis task queue** upon profile updates.
    *   Uses **SQLAlchemy (async)** for database access and **Alembic** for migrations.
2.  **Vector Database (`pgvector`)**:
    *   PostgreSQL extended with `pgvector` to store raw text and high-dimensional semantic embeddings (384-dimensional vectors).
3.  **Redis Message Broker**:
    *   Coordinates task distribution between the web server and background worker. Employs a Redis list (`embedding_queue`) for rapid, non-blocking task handling.
4.  **Background Embedding Worker (`/Worker`)**:
    *   Listens to the Redis `embedding_queue` using blocking queue operations (`BLPOP`).
    *   Calls the Google Gemini Embedding API to generate embeddings and saves them to the database to enable semantic search capabilities.
5.  **Next.js Frontend (`/frontend`)**:
    *   A responsive React dashboard using Next.js, TypeScript, and Tailwind CSS.
    *   Provides user profile builders, a job application tracker, and a custom resume-builder workbench.

---

## Directory Structure

```directory
├── App/                    # FastAPI Web Application & Domain Logic
│   ├── api/                # API Endpoints (Routes & Controllers)
│   ├── auth/               # JWT Authentication
│   ├── profile_management/ # DDD layer for professional profile assets
│   └── resume_genetor/     # DDD layer for tailoring & AI resume construction
├── Worker/                 # Background process running the embedding queue
│   └── worker.py           # Polls Postgres and interacts with Gemini Embedding API
├── frontend/               # Next.js App Router Frontend
│   ├── app/                # Frontend page routes & layouts
│   └── components/         # Reusable React components
└── docker-compose.yml      # Orchestrates local PostgreSQL, Backend, and Worker containers
```

---

## Getting Started

### Prerequisites
*   Docker & Docker Compose
*   Node.js (v18+) & npm (if running the frontend outside of docker)
*   A Gemini API Key (from Google AI Studio)

### Environment Configuration

1. Create a `.env` file in the **root directory** and configure the variables:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/postgres
DATABASE_URL_SYNC=postgresql+psycopg://postgres:postgres@db:5432/postgres

GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_jwt_secret_key_here
```

2. Create a `.env` file in the `/Worker` directory:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/postgres
GEMINI_API_KEY=your_gemini_api_key_here
```

### Running the Services

#### Option 1: Docker Compose (Recommended for Backend & Worker)

From the root directory, start PostgreSQL, FastAPI backend, and the background worker:

```bash
docker-compose up --build
```

#### Option 2: Running the Frontend

Navigate to the `frontend/` directory, install dependencies, and run the Next.js development server:

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Migrations (Alembic)

To run migrations or update the database schema, run Alembic commands within the `App` workspace:

```bash
# Run migrations to update database to head
cd App
alembic upgrade head

# Generate a new migration schema
alembic revision --autogenerate -m "description of changes"
```

---

## How the Resume Tailoring Works

1.  **Ingestion & Vectors:** When you add a new experience, skill, or project, the backend saves it and enqueues a task to the Redis `embedding_queue`. The background `Worker` immediately pops the task, embeds the item using Gemini, and updates the database.
2.  **Semantic Match:** When you paste a Job Description (JD), the backend computes the embedding of the JD and queries PostgreSQL using `pgvector` operators to fetch the most semantically relevant projects and experiences.
3.  **Refinement:** The selected resume blocks are fed into the Google Gemini LLM alongside instructions to rewrite them focusing on the key duties and keywords present in the JD, outputting a highly tailored professional resume.
