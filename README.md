# ProjectHub - AI-Enhanced Project Management Platform

An industry-grade project management SaaS platform built with MERN stack and integrated with OpenRouter for intelligent project insights and automation.

## Key Features

### Core Project Management

- **Project Management**: Create, organize, and track multiple projects
- **Task Management**: Comprehensive task lifecycle from backlog to completion
- **Team Collaboration**: Real-time team updates and collaboration
- **Resource Allocation**: Manage team members and task assignments
- **Time Tracking**: Monitor estimated vs actual hours

### AI-Powered Features

- **Smart Task Recommendations**: AI suggests tasks based on project context and team capacity
- **NLP Task Parser**: Parse natural language task descriptions into structured data
- **Predictive Analytics**: Forecast project completion dates and identify bottlenecks
- **Intelligent Automation**: Auto-trigger workflows based on conditions
- **Project Health Analysis**: AI-powered project health scoring and risk assessment

### Analytics & Insights

- **Project Dashboards**: Real-time project progress tracking
- **Team Metrics**: Velocity, capacity, and performance analytics
- **Risk Indicators**: Early warnings for project delays and resource issues
- **Historical Analytics**: Learn from past projects

## Tech Stack

### Frontend

- **React 18** - UI Library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Redux Toolkit** - State management
- **Socket.io Client** - Real-time updates
- **Axios** - HTTP client

### Backend

- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Socket.io** - WebSocket server
- **OpenRouter** - AI integration
- **Redis** - Caching & task queue

### DevOps

- **Docker** - Containerization
- **Docker Compose** - Local development
- **MongoDB Atlas** - Cloud database (production)
- **Railway/Vercel** - Deployment

## Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 6+
- Docker & Docker Compose (for containerized setup)
- A working OpenRouter API key (for AI features)

## Quick Start

### Local Development (Without Docker)

#### 1. Clone Repository

```bash
git clone <repository-url>
cd cprfinal
```

#### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm install
npm run dev
```

The backend will run on `http://localhost:5000`

#### 3. Frontend Setup (New Terminal)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### Docker Setup (Recommended)

```bash
# Copy and configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your OpenRouter API key and JWT secret

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

**Access the application:**

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- MongoDB: `mongodb://localhost:27017`
- Redis: `redis://localhost:6379`



## Environment Variables

### Backend (.env)

```
MONGODB_URI=mongodb://localhost:27017/projectmanagement
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openrouter/auto
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=ProjectHub
```

## Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. **Sign Up**: Create account with email and password
2. **Sign In**: Receive JWT token
3. **Protected Routes**: Include token in Authorization header: `Bearer <token>`
4. **Token Expiry**: Tokens expire after 7 days (configurable)

## API Endpoints

### Authentication

```
POST   /api/auth/signup         - Register new user
POST   /api/auth/signin         - Login user
GET    /api/auth/me             - Get current user
POST   /api/auth/logout         - Logout user
```

### Projects

```
GET    /api/projects            - List user's projects
POST   /api/projects            - Create new project
GET    /api/projects/:id        - Get project details
PUT    /api/projects/:id        - Update project
DELETE /api/projects/:id        - Delete project
POST   /api/projects/:id/members    - Add team member
DELETE /api/projects/:id/members/:memberId - Remove member
```

### Tasks

```
GET    /api/tasks/projects/:projectId   - List project tasks
POST   /api/tasks/projects/:projectId   - Create task
GET    /api/tasks/:id           - Get task details
PUT    /api/tasks/:id           - Update task
DELETE /api/tasks/:id           - Delete task
POST   /api/tasks/:id/subtasks  - Add subtask
```

### AI Features

```
POST   /api/ai/parse-task       - Parse natural language to task
GET    /api/ai/recommendations/:projectId - Get AI recommendations
GET    /api/ai/predictions/:projectId - Get timeline predictions
GET    /api/ai/health/:projectId - Project health analysis
```

## Deployment

### Production Deployment with Railway

1. **Prepare Repository**

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Create Railway Account**
   - Visit https://railway.app
   - Sign up with GitHub

3. **Create Services**
   - MongoDB: Add MongoDB from marketplace
   - Backend: Connect git repository, set environment variables
   - Frontend: Connect git repository

4. **Set Environment Variables**
   - Backend: All variables from `.env`
   - Frontend: All variables from `.env`

5. **Deploy**
   - Railway will automatically deploy on push

### Production Deployment with Docker

```bash
# Build images
docker build -t projecthub-backend ./backend
docker build -t projecthub-frontend ./frontend

# Push to Docker Registry (e.g., DockerHub)
docker tag projecthub-backend username/projecthub-backend:latest
docker push username/projecthub-backend:latest

# Deploy to production using docker-compose or Kubernetes
```

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

## Monitoring & Logging

- Backend logs are written to console
- Frontend errors are logged to browser console
- Use `docker-compose logs` for container logs
- Implement centralized logging (e.g., LogRocket, Sentry) for production

## Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing-feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Create Pull Request

## Roadmap

- [ ] Team collaboration with live cursors
- [ ] Gantt chart view
- [ ] Custom workflows
- [ ] Budget tracking
- [ ] Integration with Slack, GitHub, Jira
- [ ] Mobile app (React Native)
- [ ] Advanced reporting
- [ ] Custom notifications
- [ ] AI training on user data

## Known Issues

None currently. Report issues on GitHub.


