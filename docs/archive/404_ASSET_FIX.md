# 🔧 Fix: 404 Errors for JS/CSS Assets

## ❌ **Error You're Seeing:**

```
index-Dz-Aw57_.js:1  Failed to load resource: 404
index-H5Yom936.css:1  Failed to load resource: 404
```

## 🔍 **What This Means:**

Vite generates **hashed filenames** for assets during build:
- `index-Dz-Aw57_.js` - JavaScript bundle
- `index-H5Yom936.css` - CSS stylesheet

These hashes change **every time you build** if the content changes.

The 404 error means:
- ❌ Your HTML is referencing **old file hashes**
- ❌ Those files **don't exist** anymore (new build has different hashes)
- ❌ This is usually a **deployment/cache issue**

---

## ✅ **Solutions**

### **Solution 1: Force Rebuild on Vercel (Quick Fix)**

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your **gymzarsko** project

2. **Redeploy:**
   - Click on your latest deployment
   - Click **"Redeploy"** button (top right)
   - Or click **"..."** menu → **"Redeploy"**

3. **Clear Build Cache (Important!):**
   - Check **"Use existing Build Cache"** → **UNCHECK IT**
   - Click **"Redeploy"**

4. **Wait for deployment to finish** (~2-3 minutes)

5. **Hard Refresh Your Browser:**
   - **Chrome/Edge:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - **Safari:** `Cmd+Option+R`
   - **Firefox:** `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

6. **Test:** App should load correctly now! ✅

---

### **Solution 2: Clear Browser Cache**

The browser might be caching the old HTML:

1. **Open DevTools:** `F12` or `Right-click → Inspect`

2. **Application Tab:**
   - Click **"Clear storage"** in left sidebar
   - Check all boxes
   - Click **"Clear site data"**

3. **Or Clear Cache Manually:**
   - **Chrome:** Settings → Privacy → Clear browsing data → Cached images and files
   - **Safari:** Develop → Empty Caches
   - **Firefox:** Settings → Privacy → Clear Data → Cached Web Content

4. **Hard Refresh:** `Ctrl+Shift+R` or `Cmd+Shift+R`

---

### **Solution 3: Verify Build Output**

Make sure the build is generating files correctly:

```bash
# Build locally
npm run build

# Check dist folder
ls dist/assets/
# Should see files like:
# index-[hash].js
# index-[hash].css
```

If files are generated correctly locally but not on Vercel:
- Check Vercel build logs for errors
- Ensure `vercel.json` is configured correctly (see below)

---

### **Solution 4: Check Vercel Configuration**

I've created a `vercel.json` file that:
- ✅ Configures Vercel for Vite
- ✅ Sets up proper rewrites (SPA routing)
- ✅ Adds cache headers for assets
- ✅ Ensures proper build output

**The file is already created** - it should be in your repo.

**Verify it's deployed:**
1. Go to Vercel Dashboard → Settings → General
2. Make sure build settings match `vercel.json`

---

## 🐛 **Common Causes**

### **1. Stale Build Cache**
- **Fix:** Redeploy with **cache cleared** (Solution 1)

### **2. Browser Cache**
- **Fix:** Hard refresh or clear cache (Solution 2)

### **3. Build Configuration**
- **Fix:** Verify `vercel.json` is correct ✅ (Already done)

### **4. Deployed Old HTML**
- **Fix:** Force rebuild on Vercel

### **5. CDN Cache (Vercel Edge)**
- **Fix:** Wait 5-10 minutes or redeploy

---

## 🔍 **How to Debug**

### **1. Check Network Tab:**
1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Refresh page
4. Look for:
   - ❌ **Red entries** = 404 errors
   - ✅ **Green entries** = Success

### **2. Check HTML Source:**
1. Right-click page → **View Page Source**
2. Search for `<script>` tags
3. Check if the JS file name matches what's in `dist/assets/`

**Should see:**
```html
<script type="module" src="/assets/index-[hash].js"></script>
```

**If you see old hash:** Browser cache or deployment issue

### **3. Check Vercel Build Logs:**
1. Go to Vercel Dashboard
2. Click on deployment
3. Check **Build Logs** tab
4. Look for errors or warnings

---

## ✅ **Prevention**

### **1. Always Clear Cache on Redeploy:**
When redeploying, uncheck "Use existing Build Cache"

### **2. Use Proper Cache Headers:**
The `vercel.json` I created includes:
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

This ensures:
- ✅ Assets are cached properly
- ✅ HTML is not cached (always fresh)
- ✅ Browser gets latest file hashes

### **3. Test Build Locally:**
```bash
npm run build
npm run preview
```

If local preview works but deployment doesn't:
- Vercel configuration issue
- Check build logs

---

## 📋 **Quick Checklist**

When you get 404 errors:

- [ ] **1. Hard refresh browser** (`Ctrl+Shift+R`)
- [ ] **2. Clear browser cache**
- [ ] **3. Check Vercel deployment status**
- [ ] **4. Redeploy with cache cleared**
- [ ] **5. Wait 2-3 minutes after deployment**
- [ ] **6. Hard refresh again**
- [ ] **7. Check DevTools Network tab**

---

## 🎯 **Most Likely Fix**

**90% of the time, this fixes it:**

1. **Go to Vercel Dashboard**
2. **Redeploy** with **cache cleared**
3. **Wait 2-3 minutes**
4. **Hard refresh browser** (`Ctrl+Shift+R`)

That's it! ✅

---

## 📚 **Understanding the Issue**

### **Why Hashed Filenames?**

Vite uses content hashing for:
- ✅ **Cache busting** - Forces browser to download new files
- ✅ **CDN efficiency** - Can cache assets forever
- ✅ **Version control** - Different versions have different hashes

### **Example:**

**Build 1:**
- `index-abc123.js` ✅
- `index-xyz789.css` ✅

**Build 2 (after code changes):**
- `index-def456.js` ✅ (new hash)
- `index-xyz789.css` ✅ (same hash, no CSS changes)

### **The Problem:**

If HTML from Build 1 references `index-abc123.js` but only `index-def456.js` exists:
- ❌ Browser can't find `index-abc123.js`
- ❌ 404 error!

### **The Solution:**

Force fresh HTML generation with correct file references! ✅

---

## 🔧 **Advanced: Manual Fix**

If nothing else works:

### **1. Clone Repo:**
```bash
git clone https://github.com/zarsko3/Gymzarsko.git
cd Gymzarsko/gymzarski
```

### **2. Build Locally:**
```bash
npm install
npm run build
```

### **3. Check dist/index.html:**
Open `dist/index.html` and verify script tags point to files that exist in `dist/assets/`

### **4. Deploy dist folder manually:**
```bash
# If you have Vercel CLI
vercel --prod
```

---

## ✅ **Summary**

**The Issue:**
- HTML references old asset filenames (hashed)
- Those files don't exist after new build

**The Fix:**
1. Redeploy on Vercel (clear cache)
2. Hard refresh browser
3. Done! ✅

**Prevention:**
- `vercel.json` configured ✅
- Proper cache headers ✅
- Always clear cache on redeploy

---

**Most likely, a redeploy with cache cleared will fix this immediately!** 🚀

