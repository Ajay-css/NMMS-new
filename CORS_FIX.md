# CORS Fix Instructions

## Problem
After deployment, you're getting CORS errors when the frontend tries to access the backend API.

## Solution

### Step 1: Update Render Environment Variables

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your backend service (`xavier-nmms-backend` or similar)
3. Go to **Environment** tab
4. Add or update the `FRONTEND_URL` environment variable:

```
FRONTEND_URL=https://xaviers-nmms-scanner.vercel.app
```

**Important Notes:**
- Use the exact URL (with `https://`)
- No trailing slash
- If you have multiple frontend URLs, separate them with commas:
  ```
  FRONTEND_URL=https://xaviers-nmms-scanner.vercel.app,https://www.yourdomain.com
  ```

### Step 2: Redeploy Backend

After updating the environment variable:

1. Go to **Manual Deploy** tab in Render
2. Click **Deploy latest commit** (or push a new commit to trigger auto-deploy)
3. Wait for deployment to complete

### Step 3: Verify CORS is Working

Test the API endpoint:

```bash
curl -X OPTIONS https://nmms-server-new.onrender.com/api/auth/register \
  -H "Origin: https://xaviers-nmms-scanner.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

You should see:
- `Access-Control-Allow-Origin: https://xaviers-nmms-scanner.vercel.app`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH`
- `Access-Control-Allow-Credentials: true`

### Step 4: Test in Browser

1. Open your frontend: https://xaviers-nmms-scanner.vercel.app
2. Open browser DevTools (F12) → Console tab
3. Try to register/login
4. Check if CORS errors are gone

## Troubleshooting

### Still getting CORS errors?

1. **Check Environment Variable:**
   - Verify `FRONTEND_URL` is set correctly in Render
   - Make sure there are no extra spaces or quotes
   - Check the exact URL matches your Vercel deployment

2. **Check Backend Logs:**
   - Go to Render dashboard → Your service → Logs
   - Look for CORS-related messages
   - You should see: `🌐 Allowed CORS Origins: [...]`

3. **Clear Browser Cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache completely

4. **Check Network Tab:**
   - Open DevTools → Network tab
   - Try the request again
   - Check the OPTIONS (preflight) request
   - Verify response headers include `Access-Control-Allow-Origin`

5. **Verify Backend is Running:**
   ```bash
   curl https://nmms-server-new.onrender.com/api/health
   ```

### Common Issues

**Issue:** "No 'Access-Control-Allow-Origin' header"
- **Fix:** Make sure `FRONTEND_URL` environment variable is set in Render

**Issue:** "Credentials flag is true, but Access-Control-Allow-Credentials is not 'true'"
- **Fix:** Already handled in the code, but verify backend is using latest code

**Issue:** Preflight request fails
- **Fix:** The code now explicitly handles OPTIONS requests with `app.options('*', cors(corsOptions))`

## Quick Fix Command

If you have Render CLI installed:

```bash
render env:set FRONTEND_URL=https://xaviers-nmms-scanner.vercel.app
```

## After Fix

Once CORS is fixed, you should be able to:
- ✅ Register new users
- ✅ Login
- ✅ Access admin dashboard
- ✅ Upload question papers
- ✅ Scan OMR sheets
- ✅ View results

All without CORS errors!

