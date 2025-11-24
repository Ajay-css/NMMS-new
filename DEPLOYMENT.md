# Deployment Guide

This guide will help you deploy Xavier's NMMS Scanner to production.

## Architecture

- **Backend**: Deployed on Render
- **Frontend**: Deployed on Vercel
- **Database**: MongoDB Atlas (or Render MongoDB)

## Prerequisites

1. GitHub account
2. Render account (https://render.com)
3. Vercel account (https://vercel.com)
4. MongoDB Atlas account (https://www.mongodb.com/cloud/atlas) or Render MongoDB

## Step 1: Prepare Your Repository

1. Push your code to GitHub
2. Make sure all files are committed

## Step 2: Deploy Backend to Render

### 2.1 Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select your repository

### 2.2 Configure Backend Service

- **Name**: `xavier-nmms-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 2.3 Set Environment Variables

Add these environment variables in Render dashboard:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
GEMINI_API_KEY=AIzaSyBa8SSIb-3Ti2WxqMza2PyEshMbtXsp908
FRONTEND_URL=https://your-frontend-url.vercel.app
```

**Important Notes:**
- `MONGODB_URI`: Get from MongoDB Atlas or Render MongoDB
- `JWT_SECRET`: Generate a strong random string (min 32 characters)
- `FRONTEND_URL`: Will be set after frontend deployment
- `GEMINI_API_KEY`: Your Google Gemini API key

### 2.4 Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Copy your backend URL (e.g., `https://xavier-nmms-backend.onrender.com`)

## Step 3: Deploy Frontend to Vercel

### 3.1 Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository

### 3.2 Configure Frontend

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3.3 Set Environment Variables

Add this environment variable:

```
VITE_API_URL=https://your-backend-url.onrender.com
```

Replace `your-backend-url.onrender.com` with your actual Render backend URL.

### 3.4 Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Copy your frontend URL (e.g., `https://xavier-nmms-scanner.vercel.app`)

## Step 4: Update Backend CORS

1. Go back to Render dashboard
2. Update the `FRONTEND_URL` environment variable with your Vercel URL:
   ```
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```
3. Redeploy the backend service

## Step 5: Set Up MongoDB

### Option A: MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (Free tier available)
3. Create a database user
4. Whitelist Render IP (or use 0.0.0.0/0 for all IPs - less secure)
5. Get connection string and update `MONGODB_URI` in Render

### Option B: Render MongoDB

1. In Render dashboard, create a new MongoDB service
2. Copy the internal connection string
3. Update `MONGODB_URI` in your backend service

## Step 6: Verify Deployment

1. Visit your frontend URL
2. Register a new admin account
3. Test the application:
   - Login
   - Upload question paper (Admin)
   - Scan OMR sheet (Scanner)

## Troubleshooting

### Backend Issues

- **Build fails**: Check build logs in Render dashboard
- **Database connection error**: Verify `MONGODB_URI` is correct
- **CORS errors**: Ensure `FRONTEND_URL` matches your Vercel URL exactly

### Frontend Issues

- **API calls fail**: Verify `VITE_API_URL` is set correctly
- **Build fails**: Check Vercel build logs
- **404 on routes**: Ensure `vercel.json` rewrite rules are correct

### Common Issues

1. **Environment variables not updating**: 
   - Redeploy after changing env vars
   - Clear browser cache

2. **CORS errors**:
   - Check backend `FRONTEND_URL` includes protocol (https://)
   - Verify no trailing slashes

3. **File uploads fail**:
   - Check Render disk space
   - Verify uploads directory exists

## Environment Variables Summary

### Backend (Render)
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_key
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend.onrender.com
```

## Post-Deployment

1. **Create Admin Account**: Register with role "admin" on first deployment
2. **Test All Features**: 
   - Admin dashboard
   - Question paper upload
   - OMR scanning
   - Results viewing
3. **Monitor Logs**: Check Render and Vercel logs for any errors
4. **Set Up Custom Domain** (Optional):
   - Vercel: Add custom domain in project settings
   - Render: Add custom domain in service settings
   - Update `FRONTEND_URL` accordingly

## Security Checklist

- [ ] Strong `JWT_SECRET` (32+ characters)
- [ ] MongoDB user with limited permissions
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] HTTPS enabled (automatic on Render/Vercel)
- [ ] Regular backups of MongoDB

## Support

For issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check Vercel logs: Dashboard → Your Project → Deployments → View Function Logs
3. Check browser console for frontend errors

