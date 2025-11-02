# 🚀 Quick Start: Connect Firebase to Gymzarski

## What You Need
1. ✅ Firebase project created
2. ✅ Vercel deployment working
3. 📋 Firebase configuration values

---

## 3-Step Setup

### 1️⃣ Create `.env.local` file
In your project root, create `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123
```

Get these values from: **Firebase Console → Project Settings → Your apps → Web app config**

---

### 2️⃣ Add Variables to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select **Gymzarski** project
3. **Settings** → **Environment Variables**
4. Add all 6 variables (same names as above)
5. Select **all environments** (Production, Preview, Development)
6. Save

---

### 3️⃣ Enable Firestore
1. **Firebase Console** → **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"**
4. Choose your region
5. Click **Enable**

---

## Test Locally

```bash
npm run dev
```

Open browser console - you should see:
```
📦 Using Firestore for data storage
```

Create a workout, then check Firebase Console → Firestore Database. You should see your data!

---

## Deploy to Vercel

```bash
git add .
git commit -m "Add Firebase integration"
git push
```

Vercel will auto-deploy. Visit your app and test!

---

## Need Help?
Read the full guide: `FIREBASE_SETUP.md`

---

## Test Firebase Connection

Open browser console on your app and run:
```javascript
testFirebaseConnection()
```

This will verify read/write permissions.

