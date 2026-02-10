# Render Deployment Guide

## Puppeteer on Render

Puppeteer **is automatically installed** when you run `npm install` because it's listed in your `package.json` dependencies. However, there are a few things to know:

### 1. Chromium Installation
- **Fixed**: Chrome is now automatically installed during the build process
- The `render.yaml` file includes `npx puppeteer browsers install chrome` in the build command
- This ensures Chrome is available when Puppeteer tries to launch
- If you see "Could not find Chrome" errors, the build command will fix it

### 2. IP Blocking Issues
Some websites (like AutoZone, Amazon, etc.) block requests from cloud hosting IP addresses. This is why:
- ✅ Works locally (your home IP is not blocked)
- ❌ Fails on Render (cloud hosting IPs are often blocked)

### 3. Solutions

#### Option A: Use Fallback Mode (Recommended for blocked sites)
Set this environment variable in Render:
```
USE_FETCH_FALLBACK_ONLY=true
```
This skips Puppeteer entirely and uses native `fetch()` which may have a different fingerprint.

#### Option B: Automatic Fallback (Current Implementation)
The code automatically tries fallback fetch when Puppeteer gets a 403 error. Check your Render logs to see:
- "403 detected from Puppeteer, closing browser and trying fallback..."
- "Using fallback fetch method for: [url]"

#### Option C: Use a Proxy Service
For production, consider using a proxy service like:
- Bright Data
- ScraperAPI
- ProxyMesh
- Or set up your own proxy server

### 4. Checking Logs on Render

To see what's happening, check your Render service logs:
1. Go to your Render dashboard
2. Click on your service
3. Go to "Logs" tab
4. Look for messages like:
   - "Launching Puppeteer browser..."
   - "Puppeteer browser launched successfully"
   - "403 detected from Puppeteer..."
   - "Using fallback fetch method..."

### 5. Environment Variables

You can set these in Render's Environment tab:

- `USE_FETCH_FALLBACK_ONLY=true` - Skip Puppeteer, use fetch only
- `FORCE_FETCH_FALLBACK=true` - Same as above
- `AI_FETCH_URL_TIMEOUT_MS=60000` - Timeout for URL fetching (default: 60000ms)

### 6. Troubleshooting

**If Puppeteer fails to launch:**
- Check logs for "Failed to launch Puppeteer browser"
- The code automatically falls back to fetch() method
- This is normal if Chromium can't start

**If you get 403 errors:**
- This means the website is blocking your server's IP
- The code will automatically try fallback fetch
- If both fail, you'll need a proxy service or manual entry

**If fallback also gets 403:**
- The website is blocking all requests from Render's IP range
- Consider using a proxy service
- Or allow users to manually enter product information
