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

---

## Production Deployment (AWS & Terraform)

The project includes a production-grade infrastructure deployment suite managed via **Terraform** targeting the **`eu-north-1`** (Stockholm) region.

### 🏗️ AWS Cloud Architecture Components
The Terraform configuration in `deployment/terraform/` is divided into modular stacks:
*   **`vpc.tf`**: Sets up VPC network isolation, Multi-AZ subnets, NAT Gateways, and Internet Gateways.
*   **`security_groups.tf`**: Configures access security rules separating ALB, ECS container tasks, RDS Postgres DB, and ElastiCache Redis nodes.
*   **`database.tf`**: Provisions a PostgreSQL RDS instance (with native `pgvector` support) and a Redis cluster broker.
*   **`queues.tf`**: Provisions an Amazon SQS Queue for task distribution.
*   **`ecs.tf`**: Defines the ECS Fargate cluster, serverless task definitions, IAM Task Roles (CloudWatch, SQS, SSM policies), Application Load Balancers (ALB), and target routing listener rules.

### 🚀 Deploying to AWS

1.  **Configure AWS Credentials**:
    Ensure your terminal is authenticated with your target region (`eu-north-1`):
    ```bash
    aws configure
    ```
2.  **Build and Push the Container**:
    Create your registry and push the FastAPI backend Docker image to ECR:
    ```bash
    # Create the repository
    aws ecr create-repository --repository-name resume-tracker-app --region eu-north-1
    
    # Authenticate Docker with ECR
    aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com
    
    # Build, tag and push
    docker build -t resume-tracker-app ./App
    docker tag resume-tracker-app:latest YOUR_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com/resume-tracker-app:latest
    docker push YOUR_ACCOUNT_ID.dkr.ecr.eu-north-1.amazonaws.com/resume-tracker-app:latest
    ```
3.  **Provision with Terraform**:
    Initialize the workspace, copy the variable templates, and run the plan:
    ```bash
    cd deployment/terraform
    cp terraform.tfvars.example terraform.tfvars
    # Fill in your ECR URL and DB passwords in terraform.tfvars
    
    terraform init
    terraform apply
    ```

### ⚡ Database Migrations & ECS Exec
*   **Auto-Migration on Startup**: The ECS containers use [App/start.sh] to execute Alembic migrations dynamically on Fargate boot, keeping the RDS database schema up-to-date.
*   **Debugging via ECS Exec**: Debug container internals interactively by logging directly into Fargate tasks:
    ```bash
    aws ecs execute-command \
      --cluster resume-tracker-cluster \
      --task <TASK_ID> \
      --container app \
      --command "/bin/sh" \
      --interactive \
      --region eu-north-1
    ```

