# Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] All environment variables are documented
- [ ] MongoDB database is set up (Atlas or Render)
- [ ] Gemini API key is ready
- [ ] Strong JWT secret is generated (32+ characters)

## Backend Deployment (Render)

- [ ] Render account created
- [ ] New Web Service created
- [ ] GitHub repository connected
- [ ] Root directory set to `backend`
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Environment variables set:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [ ] `MONGODB_URI` (from MongoDB Atlas/Render)
  - [ ] `JWT_SECRET` (strong random string)
  - [ ] `GEMINI_API_KEY`
  - [ ] `FRONTEND_URL` (will update after frontend deploy)
- [ ] Service deployed successfully
- [ ] Health check endpoint working: `/api/health`
- [ ] Backend URL copied (e.g., `https://xavier-nmms-backend.onrender.com`)

## Frontend Deployment (Vercel)

- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Root directory set to `frontend`
- [ ] Framework preset: Vite
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variable set:
  - [ ] `VITE_API_URL` (your Render backend URL)
- [ ] Project deployed successfully
- [ ] Frontend URL copied (e.g., `https://xavier-nmms-scanner.vercel.app`)

## Post-Deployment

- [ ] Update backend `FRONTEND_URL` with Vercel URL
- [ ] Redeploy backend to apply CORS changes
- [ ] Test frontend can connect to backend
- [ ] Register admin account
- [ ] Test admin features:
  - [ ] Login works
  - [ ] Question paper upload works
  - [ ] Answer keys are created
- [ ] Test scanner features:
  - [ ] Camera access works
  - [ ] OMR scanning works
  - [ ] Results display correctly
- [ ] Test results page:
  - [ ] Results are saved
  - [ ] Results can be viewed

## Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] MongoDB user has limited permissions
- [ ] CORS only allows your frontend URL
- [ ] Environment variables are secure (not in code)
- [ ] HTTPS enabled (automatic on Render/Vercel)
- [ ] API keys are not exposed in frontend code

## Monitoring

- [ ] Render logs are accessible
- [ ] Vercel logs are accessible
- [ ] Error tracking set up (optional)
- [ ] Database backups configured (MongoDB Atlas)

## Troubleshooting

If something doesn't work:

1. **Check Logs**:
   - Render: Dashboard → Service → Logs
   - Vercel: Dashboard → Project → Deployments → View Function Logs

2. **Verify Environment Variables**:
   - All variables are set correctly
   - No typos in variable names
   - Values match expected format

3. **Test API Endpoints**:
   - Use Postman or curl to test backend directly
   - Check CORS headers in response

4. **Clear Browser Cache**:
   - Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
   - Clear browser cache and cookies

5. **Check Network Tab**:
   - Open browser DevTools → Network
   - Check if API calls are reaching backend
   - Check for CORS errors

## Quick Commands

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Backend Health
```bash
curl https://your-backend.onrender.com/api/health
```

### Test Frontend Build Locally
```bash
cd frontend
npm run build
npm run preview
```

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide

