# Firebase Firestore Setup Guide

## Issue
The database is not saving data when you open the app in a new tab. This is likely due to Firestore security rules or the database not being properly initialized.

## Solution Steps

### 1. Check Firestore Security Rules

Go to your Firebase Console:
1. Visit https://console.firebase.google.com/
2. Select your project: **isla-65ae2**
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab

### 2. Update Security Rules (For Development)

Replace your current rules with these **development-friendly** rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents (DEVELOPMENT ONLY)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ IMPORTANT:** These rules allow anyone to read/write to your database. This is fine for development, but you MUST update them before going to production.

### 3. Production Security Rules (Use Later)

When you're ready to deploy, use these more secure rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Guests collection
    match /guests/{guestId} {
      allow read, write: if request.auth != null;
    }
    
    // Products collection
    match /products/{productId} {
      allow read, write: if request.auth != null;
    }
    
    // Channels collection
    match /channels/{channelId} {
      allow read, write: if request.auth != null;
    }
    
    // Staff collection
    match /staff/{staffId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Verify Database Connection

After updating the rules:

1. **Open your browser console** (F12 or Right-click → Inspect → Console)
2. **Refresh the page**
3. Look for these console messages:
   - 🔥 Initializing Firebase listeners...
   - ✅ Guests snapshot received: X documents
   - ✅ Products snapshot received: X documents
   - ✅ Channels snapshot received: X documents
   - ✅ Staff snapshot received: X documents

### 5. Test Adding Data

1. Go to the **All Guests** page
2. Click **Add New Guest**
3. Fill in the form and click **Add Guest**
4. Check the console for:
   - 📝 Adding guest to Firebase: {...}
   - ✅ Guest added successfully with ID: xxx

### 6. Common Error Messages

If you see errors in the console:

**Error: "Missing or insufficient permissions"**
- Solution: Update your Firestore security rules (Step 2)

**Error: "PERMISSION_DENIED"**
- Solution: Your security rules are blocking access. Use the development rules from Step 2

**Error: "Failed to get document"**
- Solution: The collection doesn't exist yet. Add your first document and it will be created automatically

### 7. Initialize Collections (Optional)

If you want to pre-populate your database, you can manually add documents in the Firebase Console:

1. Go to **Firestore Database** → **Data** tab
2. Click **Start collection**
3. Create these collections:
   - `guests` (will be auto-created when you add your first guest)
   - `products` (optional - will use default values if empty)
   - `channels` (optional - will use default values if empty)
   - `staff` (optional - will use default values if empty)

## Testing Checklist

- [ ] Updated Firestore security rules
- [ ] Published the rules in Firebase Console
- [ ] Refreshed the application
- [ ] Checked browser console for Firebase connection logs
- [ ] Added a test guest
- [ ] Verified guest appears in Firebase Console
- [ ] Opened app in new tab and verified data persists
- [ ] Checked that data syncs across multiple tabs

## Current Configuration

Your Firebase project is configured with:
- **Project ID:** isla-65ae2
- **App ID:** 1:193326948774:web:07d8b5b74d3dfd0c372f67
- **Database:** Firestore

## Need Help?

If you're still experiencing issues:
1. Check the browser console for detailed error messages
2. Verify your internet connection
3. Make sure you're logged into the correct Google account in Firebase Console
4. Try clearing browser cache and reloading
