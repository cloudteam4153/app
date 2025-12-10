# CORS Proxy Debugging Checklist

Follow these steps in order to identify where the issue is:

## Step 1: Check Browser Console Logs

1. Open your browser's Developer Tools (F12 or Cmd+Option+I)
2. Go to the **Console** tab
3. Refresh the page or trigger the API call
4. Look for these logs:
   - `[API Config] Development mode detected`
   - `[API Config] API_BASE_URL:` (should be empty string `""`)
   - `[API Debug] Full URL:` (should be a relative URL like `/connections`, NOT `http://integrations-svc-ms2-ft4pa23xra-uc.a.run.app/connections`)

**What to check:**
- ✅ If `API_BASE_URL` is empty string → Configuration is correct
- ❌ If `API_BASE_URL` is `http://integrations-svc-ms2-ft4pa23xra-uc.a.run.app` → Configuration issue
- ✅ If Full URL is relative (starts with `/`) → Will use proxy
- ❌ If Full URL is absolute (starts with `http://`) → Will NOT use proxy

---

## Step 2: Check Browser Network Tab

1. Stay in Developer Tools
2. Go to the **Network** tab
3. Clear the network log (trash icon)
4. Refresh the page or trigger the API call
5. Find the failed request (usually `/connections`, `/messages`, or `/health`)
6. Click on it to see details

**What to check:**
- **Request URL**: Should be `http://localhost:5173/connections` (or your Vite port)
  - ✅ Correct: `http://localhost:5173/connections`
  - ❌ Wrong: `http://integrations-svc-ms2-ft4pa23xra-uc.a.run.app/connections`
- **Status**: What status code? (404, 500, CORS error?)
- **Response**: What does the response say?

---

## Step 3: Check Vite Terminal Logs

1. Look at the terminal where you ran `npm run dev`
2. When you make an API call, you should see:
   - `Proxying request: GET /connections -> /connections`
   - Or similar proxy logs

**What to check:**
- ✅ If you see proxy logs → Proxy is working
- ❌ If you see NO proxy logs → Proxy is NOT intercepting requests
- ❌ If you see proxy errors → Backend might be unreachable

---

## Step 4: Test Backend Directly

Test if the backend is actually reachable:

```bash
# Test if backend is accessible
curl http://integrations-svc-ms2-ft4pa23xra-uc.a.run.app/health

# Or test from browser (open in new tab):
# http://integrations-svc-ms2-ft4pa23xra-uc.a.run.app/health
```

**What to check:**
- ✅ If curl/browser works → Backend is reachable
- ❌ If curl/browser fails → Backend is not accessible (network/firewall issue)

---

## Step 5: Test Proxy Directly

Test if Vite proxy is working:

1. Make sure Vite dev server is running on `http://localhost:5173` (or check your port)
2. Open browser and go to: `http://localhost:5173/health`
3. This should proxy to `http://integrations-svc-ms2-ft4pa23xra-uc.a.run.app/health`

**What to check:**
- ✅ If you see JSON response → Proxy is working
- ❌ If you see 404 or error → Proxy configuration issue

---

## Step 6: Verify Vite Config

Check that `vite.config.js` has the proxy configuration:

```javascript
server: {
  proxy: {
    '/connections': { target: 'http://integrations-svc-ms2-ft4pa23xra-uc.a.run.app', ... },
    '/messages': { target: 'http://integrations-svc-ms2-ft4pa23xra-uc.a.run.app', ... },
    // etc.
  }
}
```

**What to check:**
- ✅ Proxy config exists → Configuration is present
- ❌ No proxy config → Need to add it

---

## Step 7: Check Environment Variables

Check if any environment variables are overriding the config:

1. Look for `.env` file in the project root
2. Check if `VITE_API_HOST` or `VITE_API_PORT` are set
3. These might be forcing absolute URLs

**What to check:**
- ✅ No `.env` file or no `VITE_API_HOST` → Should use relative URLs
- ❌ `.env` has `VITE_API_HOST=35.188.76.100` → This might cause issues

---

## Common Issues & Solutions

### Issue 1: API_BASE_URL is NOT empty in dev mode
**Solution**: Check `import.meta.env.DEV` - it might be false. Try using `import.meta.env.MODE === 'development'` instead.

### Issue 2: Proxy not intercepting requests
**Solution**: 
- Make sure you restarted Vite dev server after adding proxy config
- Check that the request path matches the proxy path exactly (e.g., `/connections` not `/api/connections`)

### Issue 3: Backend not reachable
**Solution**: 
- Check if `integrations-svc-ms2-ft4pa23xra-uc.a.run.app` is accessible from your machine
- Check firewall/network settings
- Verify the backend service is actually running

### Issue 4: CORS error still appears
**Solution**: 
- Make sure the request is going through the proxy (check Network tab - URL should be localhost)
- If URL is still `integrations-svc-ms2-ft4pa23xra-uc.a.run.app`, the proxy isn't working

---

## Quick Test Script

Run this in browser console to test:

```javascript
// Test 1: Check API_BASE_URL
console.log('API_BASE_URL:', import.meta.env.DEV ? '' : 'http://integrations-svc-ms2-ft4pa23xra-uc.a.run.app');

// Test 2: Make a test request
fetch('/health')
  .then(r => r.json())
  .then(d => console.log('✅ Proxy works!', d))
  .catch(e => console.error('❌ Proxy failed:', e));
```

---

## Report Back

After following these steps, report:
1. What does `API_BASE_URL` show in console? (empty string or full URL?)
2. What URL appears in Network tab? (localhost or 35.188.76.100?)
3. Do you see proxy logs in Vite terminal? (yes/no)
4. Can you access `http://integrations-svc-ms2-ft4pa23xra-uc.a.run.app/health` directly? (yes/no)
5. What error message do you see exactly?
