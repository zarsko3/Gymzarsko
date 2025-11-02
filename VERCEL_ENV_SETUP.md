# 🚀 Vercel Environment Variables Setup

## ✅ What's Already Done:
- ✅ `.env.local` created with your Firebase config
- ✅ Firebase SDK installed and configured
- ✅ Code pushed to GitHub
- ✅ Vercel will auto-deploy

---

## 📋 **Step-by-Step: Add Environment Variables to Vercel**

### Step 1: Open Vercel Dashboard

1. Go to: **https://vercel.com/dashboard**
2. Find and click your **"Gymzarsko"** project

---

### Step 2: Navigate to Environment Variables

1. Click **"Settings"** (top navigation)
2. Click **"Environment Variables"** (left sidebar)

---

### Step 3: Add Each Variable

You need to add **7 variables**. For each one:

1. Click **"Add New"** button
2. Enter the **Key** (variable name)
3. Enter the **Value** (from your Firebase config)
4. Select **all environments**:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
5. Click **"Save"**

---

### **Variables to Add:**

Copy these **EXACT** values:

#### Variable 1:
```
Key:   VITE_FIREBASE_API_KEY
Value: AIzaSyCrgPbHnkncJ-eP6Q_RfUY_8-AC4tnaQOU
```

#### Variable 2:
```
Key:   VITE_FIREBASE_AUTH_DOMAIN
Value: gymzarsko.firebaseapp.com
```

#### Variable 3:
```
Key:   VITE_FIREBASE_PROJECT_ID
Value: gymzarsko
```

#### Variable 4:
```
Key:   VITE_FIREBASE_STORAGE_BUCKET
Value: gymzarsko.firebasestorage.app
```

#### Variable 5:
```
Key:   VITE_FIREBASE_MESSAGING_SENDER_ID
Value: 806481435387
```

#### Variable 6:
```
Key:   VITE_FIREBASE_APP_ID
Value: 1:806481435387:web:992d41dcb100e9bb81ee5e
```

#### Variable 7:
```
Key:   VITE_FIREBASE_MEASUREMENT_ID
Value: G-Q11Y4H4Y5S
```

---

### Step 4: Verify All Variables

After adding all 7, you should see:

```
✓ VITE_FIREBASE_API_KEY              (Production, Preview, Development)
✓ VITE_FIREBASE_AUTH_DOMAIN          (Production, Preview, Development)
✓ VITE_FIREBASE_PROJECT_ID           (Production, Preview, Development)
✓ VITE_FIREBASE_STORAGE_BUCKET       (Production, Preview, Development)
✓ VITE_FIREBASE_MESSAGING_SENDER_ID  (Production, Preview, Development)
✓ VITE_FIREBASE_APP_ID               (Production, Preview, Development)
✓ VITE_FIREBASE_MEASUREMENT_ID       (Production, Preview, Development)
```

---

### Step 5: Trigger Redeploy

Option A - **Automatic** (Vercel may auto-redeploy after adding env vars)
- Check the "Deployments" tab

Option B - **Manual Redeploy**:
1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click **"⋯"** (three dots)
4. Click **"Redeploy"**
5. Click **"Redeploy"** again to confirm

---

## ✅ **Testing Your Deployed App**

### Wait for Deployment
- It takes ~1-2 minutes
- You'll see "Building" → "Deploying" → "Ready"

### Test in Browser:
1. Visit your Vercel app URL (e.g., `gymzarsko.vercel.app`)
2. Open **DevTools** (press F12)
3. Go to **Console** tab
4. You should see:
   ```
   📦 Using Firestore for data storage
   ```

### Create a Test Workout:
1. Click **"Start Today's Workout"**
2. Select **"Push Day"**
3. Log a few sets (e.g., Bench Press: 60kg x 10 reps)
4. Click **"Complete Workout"**

### Verify in Firebase:
1. Open Firebase Console: https://console.firebase.google.com/
2. Select **"gymzarsko"** project
3. Go to **Build** → **Firestore Database**
4. You should see:
   - **`workouts`** collection
   - Your workout document inside! 🎉

---

## 🧪 **Run Firebase Connection Test**

In your deployed app, open browser console and run:
```javascript
testFirebaseConnection()
```

Expected output:
```
🔍 Testing Firebase connection...
✅ Firebase initialized
✅ Successfully read from Firestore (X documents)
✅ Successfully wrote to Firestore
✅ Successfully deleted test document
🎉 Firebase connection successful!
```

---

## 🎯 **Testing Locally**

Your local environment is already configured!

1. Make sure dev server is running:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173

3. Check console for:
   ```
   📦 Using Firestore for data storage
   ```

4. Create a workout and verify it appears in Firebase Console!

---

## 🚨 **Troubleshooting**

### Problem: "Using Local Storage" in deployed app
**Solution**: 
- Verify all 7 variables are in Vercel
- Make sure all have **Production** environment selected
- Redeploy the app

### Problem: "Permission denied" errors
**Solution**: 
- Go to Firebase Console → Firestore Database → Rules
- Make sure it shows:
  ```javascript
  allow read, write: if true;
  ```
- Click "Publish" if you changed it

### Problem: Can't see data in Firebase
**Solution**:
- Run `testFirebaseConnection()` in console
- Check for error messages
- Verify Firebase project ID matches in all variables

### Problem: Build fails in Vercel
**Solution**:
- Check Vercel deployment logs
- Look for Firebase-related errors
- Verify no typos in environment variable names (must be EXACT)

---

## ✅ **Success Checklist**

- [ ] All 7 environment variables added to Vercel
- [ ] All variables applied to all 3 environments
- [ ] App redeployed successfully
- [ ] Console shows "Using Firestore for data storage"
- [ ] Created test workout in deployed app
- [ ] Workout appears in Firebase Console
- [ ] `testFirebaseConnection()` returns success

---

## 🎉 **You're Done!**

Once all checklist items are ✅, your app is:
- ✅ Connected to Firebase Firestore
- ✅ Storing data in the cloud
- ✅ Accessible from any device
- ✅ Auto-syncing all workouts

---

## 📊 **Next Steps** (Optional)

### Monitor Firebase Usage:
- Firebase Console → Build → Firestore Database → Usage tab
- Free tier: 50K reads/day, 20K writes/day

### Add Security Rules (Future):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workouts/{workoutId} {
      // Only allow if user is authenticated (after adding auth)
      allow read, write: if request.auth != null;
    }
  }
}
```

### Enable Firebase Authentication:
- Firebase Console → Build → Authentication
- Enable Email/Password or Google Sign-In
- We can integrate this later!

---

**Need help? Share your Vercel deployment URL and I'll help debug!** 🚀

