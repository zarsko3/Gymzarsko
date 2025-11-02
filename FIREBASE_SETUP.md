# 🔥 Firebase Setup Guide for Gymzarski

## Overview
This guide will help you connect your Gymzarski app to Firebase Firestore database.

---

## Step 1: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **Gymzarski** project
3. Click **⚙️ (Settings)** → **Project Settings**
4. Scroll to **"Your apps"** section
5. If you haven't added a web app yet:
   - Click the **Web** icon (`</>`)
   - Register app: **"Gymzarski Web"**
   - Copy the configuration object

Your Firebase config will look like:
```javascript
{
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "gymzarski-xxxxx.firebaseapp.com",
  projectId: "gymzarski-xxxxx",
  storageBucket: "gymzarski-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxx"
}
```

---

## Step 2: Enable Firestore Database

1. In Firebase Console → **Build** → **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for now)
4. Select your preferred region
5. Click **"Enable"**

---

## Step 3: Set Up Local Environment Variables

1. **Create `.env.local` file** in your project root (`gymzarski/.env.local`):

```env
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

2. **Replace the placeholder values** with your actual Firebase config values

3. **Restart your dev server**:
```bash
npm run dev
```

4. Check the console - you should see:
```
📦 Using Firestore for data storage
```

---

## Step 4: Configure Vercel Environment Variables

1. Go to **[Vercel Dashboard](https://vercel.com/dashboard)**
2. Select your **Gymzarski** project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_FIREBASE_API_KEY` | Your API key | Production, Preview, Development |
| `VITE_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com | Production, Preview, Development |
| `VITE_FIREBASE_PROJECT_ID` | your-project-id | Production, Preview, Development |
| `VITE_FIREBASE_STORAGE_BUCKET` | your-project.appspot.com | Production, Preview, Development |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID | Production, Preview, Development |
| `VITE_FIREBASE_APP_ID` | Your app ID | Production, Preview, Development |

5. **Redeploy your app** (Vercel will automatically redeploy after adding env vars)

---

## Step 5: Set Up Firestore Security Rules

### For Development (Test Mode)
Your database is currently open to all reads/writes. This is fine for testing.

### For Production (Secure)
1. Go to Firebase Console → **Firestore Database** → **Rules**
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Workouts collection
    match /workouts/{workoutId} {
      // Allow read/write for all users (we'll add auth later)
      allow read, write: if true;
    }
    
    // Templates collection (if you add it later)
    match /templates/{templateId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

3. Click **"Publish"**

**Note**: These rules allow public access. Once you add authentication, update them to:
```javascript
allow read, write: if request.auth != null;
```

---

## Step 6: Test the Connection

### Test Locally:
1. Run `npm run dev`
2. Open the app
3. Create a new workout
4. Go to Firebase Console → Firestore Database
5. You should see a new `workouts` collection with your workout data!

### Test on Vercel:
1. Push your changes to GitHub:
```bash
git add .
git commit -m "Add Firebase Firestore integration"
git push
```

2. Vercel will auto-deploy
3. Visit your deployed app
4. Create a workout
5. Check Firebase Console - data should appear!

---

## Step 7: Monitor Usage

1. Go to Firebase Console → **Build** → **Firestore Database** → **Usage**
2. Monitor:
   - Document reads/writes
   - Storage size
   - Network egress

**Free Tier Limits:**
- 50K document reads/day
- 20K document writes/day
- 1 GiB storage

---

## Troubleshooting

### ❌ "Firebase not configured" message
**Solution**: Make sure all `VITE_FIREBASE_*` environment variables are set

### ❌ "Permission denied" errors
**Solution**: Check your Firestore security rules (should allow public access for now)

### ❌ Data not showing in Firebase Console
**Solution**: 
1. Check browser console for errors
2. Verify environment variables are correct
3. Make sure you're looking at the correct Firebase project

### ❌ Vercel deployment shows "Using Local Storage"
**Solution**: 
1. Verify environment variables are set in Vercel
2. Redeploy the app after adding variables
3. Check Vercel deployment logs for Firebase initialization

---

## Data Migration (Optional)

If you have existing local storage data you want to migrate:

1. Open your app in browser (before switching to Firestore)
2. Open DevTools Console
3. Export data:
```javascript
JSON.stringify(localStorage.getItem('gymzarski_workouts'))
```
4. Contact me if you need a migration script!

---

## Next Steps

✅ Firebase connected!
✅ Data syncing to cloud!

**Future Enhancements:**
- [ ] Add Firebase Authentication (user accounts)
- [ ] Add offline support (Firestore offline persistence)
- [ ] Add data backup/export feature
- [ ] Add real-time syncing across devices
- [ ] Add user profiles and preferences

---

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Vercel deployment logs
3. Verify all environment variables are correct
4. Make sure Firebase project is in the correct region

---

**🎉 Congratulations! Your app is now using Firebase Firestore!**

