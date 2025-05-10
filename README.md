# Retro Board

A collaborative retrospective board application built with React and Firebase.

## Features

- Anonymous login
- Create and join retrospective meetings via shareable links
- Real-time updates using Firebase
- Three columns for feedback: What went well, What could be improved, Brilliant ideas
- Drag and drop functionality for organizing points
- React to points with thumbs up

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a Firebase project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Add a web app to your project
   - Enable Authentication (Anonymous sign-in)
   - Create a Firestore database

4. Update Firebase configuration:
   - Open `src/firebase.js`
   - Replace the placeholder values with your Firebase project configuration

5. Start the development server:
   ```
   npm run dev
   ```

## Firebase Configuration

In `src/firebase.js`, replace the placeholder values with your Firebase project configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Deployment

To build the app for production:

```
npm run build
```

You can then deploy the contents of the `dist` folder to any static hosting service like Firebase Hosting, Netlify, or Vercel.

## License

MIT
