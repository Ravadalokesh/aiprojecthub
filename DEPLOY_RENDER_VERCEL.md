# ProjectHub Deployment Guide

## Architecture

- Frontend: Vercel
- Backend API: Render
- Database: MongoDB Atlas free tier

## Important Note About Free Hosting

- Render free web services are good for demos and portfolio deployments, but Render's own docs say free instances should not be used for production applications.
- Vercel is a good fit for the frontend on a free hobby deployment.

## 1. Prepare MongoDB Atlas

1. Create a free MongoDB Atlas cluster.
2. Create a database user with a username and password.
3. In Network Access, allow access from `0.0.0.0/0` for quick setup.
4. Copy the connection string and replace the password placeholder.

Example:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/projectmanagement?retryWrites=true&w=majority
```

## 2. Deploy the Backend to Render

1. Push this repository to GitHub.
2. In Render, create a new `Web Service`.
3. Connect the GitHub repository.
4. Set the Root Directory to `backend`.
5. Use these commands:

```txt
Build Command: npm ci && npm run build
Start Command: npm start
```

6. Add these environment variables in Render:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=use_a_long_random_secret_here
JWT_EXPIRE=7d
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://your-custom-domain.com
OPENROUTER_API_KEY=optional_for_ai_features
OPENROUTER_MODEL=openrouter/auto
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=20
```

7. Deploy and confirm the health check works:

```txt
https://your-render-service.onrender.com/health
```

## 3. Deploy the Frontend to Vercel

1. In Vercel, import the same GitHub repository.
2. Set the project Root Directory to `frontend`.
3. Keep the framework preset as `Vite`.
4. Add this environment variable:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

5. Deploy the frontend.

The included `frontend/vercel.json` file handles SPA route rewrites, so direct refreshes on `/dashboard` and other routes keep working.

## 4. Connect Frontend and Backend

1. Copy the Vercel production URL.
2. Update the Render `ALLOWED_ORIGINS` variable with that exact URL.
3. Redeploy the backend if Render does not auto-restart after the env change.

Example:

```env
ALLOWED_ORIGINS=https://projecthub-yourteam.vercel.app
```

## 5. Optional Custom Domains

- Add the custom domain in Vercel for the frontend.
- Add the custom domain in Render for the backend.
- Update `ALLOWED_ORIGINS` in Render with the final frontend domain.
- Update `VITE_API_URL` in Vercel if you also add a backend custom domain.

## 6. Production Checklist

- `JWT_SECRET` is strong and private.
- `MONGODB_URI` points to Atlas, not localhost.
- `ALLOWED_ORIGINS` matches your Vercel domain.
- `VITE_API_URL` points to the Render backend `/api` URL.
- `https://your-render-service.onrender.com/health` returns `OK`.
- Sign up, sign in, create a project, and open analytics successfully.
