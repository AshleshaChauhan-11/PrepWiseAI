# 🚀 PrepWiseAI – Final Vercel Deployment Guide

This repository is fully configured for seamless, 1-click full-stack deployment on **Vercel**. Both the React + Vite frontend and the Node.js / Express backend deploy together under a single domain without CORS configuration issues.

---

## 🛠️ How It Works on Vercel

```
[User Browser]
       │
       ▼
[Vercel Global Edge Network]
  ├── /api/*  ──────►  [Serverless Express API (api/index.js -> backend/server.js)]
  └── /*      ──────►  [React + Vite Static SPA (frontend/dist/index.html)]
```

* **Frontend:** Built automatically via `npm run build` into `frontend/dist/`.
* **Backend:** Express API served as a Vercel Serverless Function via `api/index.js`.
* **Uploads:** Handled in Vercel's writable `/tmp` directory (`os.tmpdir()`), preventing read-only file system errors (`EROFS`).
* **Routing:** `vercel.json` rewrites all `/api/*` calls to the serverless function and all other routes to `/index.html` for client-side routing.

---

## 📋 Prerequisites Before Deploying

1. **GitHub Account:** Push this repository to your GitHub profile.
2. **MongoDB Atlas Account:** A free MongoDB cluster (M0) from [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas).
   > ⚠️ **Important:** In MongoDB Atlas -> **Network Access**, ensure IP Access List includes `0.0.0.0/0` (Allow access from anywhere), so Vercel's dynamic serverless IPs can connect.
3. **Groq API Key:** Get a free API key at [console.groq.com](https://console.groq.com/keys).

---

## 🚀 Step-by-Step Vercel Deployment

### Step 1: Push Code to GitHub

Open terminal in this project folder and push to your repository:
```bash
git add .
git commit -m "Configure full-stack PrepWiseAI for Vercel deployment"
git push origin main
```

---

### Step 2: Import Project in Vercel

1. Log in to [vercel.com](https://vercel.com).
2. Click **"Add New..."** -> **"Project"**.
3. Select your GitHub repository (`PrepWiseAI`).
4. **Project Settings:**
   * **Framework Preset:** Leave as `Other` (or `Vite`).
   * **Root Directory:** `./` (Leave as root! Do NOT change to `frontend` or `backend`).
   * **Build Command:** Auto-detected from `vercel.json` (`cd frontend && npm install && npm run build`).
   * **Output Directory:** Auto-detected from `vercel.json` (`frontend/dist`).

---

### Step 3: Add Environment Variables in Vercel

Under the **Environment Variables** section, add the following 4 keys:

| Name | Example Value | Description |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://admin:pass@cluster0.xyz.mongodb.net/prepwiseai?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `prepwise_super_secure_jwt_secret_2026_xyz` | Random 32+ character string for token signing |
| `JWT_EXPIRE` | `7d` | Token expiration duration |
| `GROQ_API_KEY` | `gsk_abc123...` | Your Groq Cloud API Key |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Target Groq LLM model (optional, defaults to openai/gpt-oss-120b) |
| `NODE_ENV` | `production` | Production environment flag |

---

### Step 4: Click "Deploy"

1. Click **Deploy**.
2. Vercel will install dependencies, build the Vite frontend, bundle the Express serverless function, and provision your production URL (e.g., `https://prepwise-ai.vercel.app`).
3. Once deployed, verify your deployment:
   * Health Check: `https://your-domain.vercel.app/api/health`
   * Web App: `https://your-domain.vercel.app/`

---

## 🧪 Local Development Setup

To run both frontend and backend locally on your computer:

### Terminal 1: Backend
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:8000
```

### Terminal 2: Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🔍 Troubleshooting Checklist

* **Issue: `MongooseServerSelectionError: connection timed out`**
  * *Fix:* Go to MongoDB Atlas -> Security -> Network Access -> Add IP Address -> Set to `0.0.0.0/0` (Allow Access from Anywhere).
* **Issue: `Groq API Error: 401 Unauthorized`**
  * *Fix:* Verify `GROQ_API_KEY` is pasted correctly in Vercel Environment Variables without quotes or leading spaces.
* **Issue: `404 Route not found on page refresh`**
  * *Fix:* Handled automatically by `vercel.json` rewrite (`"source": "/(.*)", "destination": "/index.html"`).
* **Issue: `EROFS: read-only file system` during upload**
  * *Fix:* Handled in `backend/config/multer.js` using `os.tmpdir()` for Vercel serverless environments.

