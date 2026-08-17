# Deploy Guide

Backend: Fly.io | Frontend: Vercel | Database: Supabase

## Prerequisites

```bash
# Fly CLI
brew install flyctl
flyctl auth login

# Vercel CLI
npm install -g vercel
vercel login
```

## 1. Supabase Database

1. Create project at supabase.com
2. Get connection string from Settings > Database > Connection pooling
3. Copy `DATABASE_URL` (for backend env vars)

## 2. Backend (Fly.io)

```bash
cd backend

# Create Fly app
flyctl launch

# Run migrations against Supabase
DATABASE_URL="your-supabase-url" npx prisma migrate deploy

# Set secrets
flyctl secrets set \
  DATABASE_URL="postgresql://..." \
  SUPABASE_URL="https://xxx.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="xxx" \
  SUPABASE_LOGO_BUCKET="logos" \
  JWT_SECRET="$(openssl rand -hex 32)" \
  FRONTEND_URL="your-app.vercel.app" \
  NODE_ENV="production" \
  PORT="3000"

# Deploy
flyctl deploy
```

Save your backend URL (e.g., `your-app.fly.dev`)

## 3. Frontend (Vercel)

```bash
cd frontend

# Deploy and link repo
vercel

# Set production env var
# In Vercel dashboard: Settings > Environment Variables
# NEXT_PUBLIC_API_URL = https://your-app.fly.dev

# Redeploy for env var to take effect
vercel --prod
```

## Checklist

- [ ] Database migrations ran on Supabase
- [ ] Backend env vars set on Fly
- [ ] Backend deployed and working
- [ ] Frontend `NEXT_PUBLIC_API_URL` points to backend
- [ ] Frontend deployed
- [ ] Test login flow (should work cross-domain)
- [ ] Test logo upload (depends on SUPABASE_LOGO_BUCKET)
- [ ] Monitor error tracking (add Sentry if needed)

## Rollback

```bash
# Backend
flyctl releases list
flyctl releases rollback

# Frontend
# Vercel dashboard > Deployments > Rollback
```
