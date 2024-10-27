const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');

const app = express();

// Initialize Firebase Admin SDK
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://anonymous-app-32575-default-rtdb.firebaseio.com/"
});

// Initialize Firebase Client SDK
const firebaseConfig = {
  apiKey: "AIzaSyCTIQV1KL75W7zw8AcJX5sF00Fdc8Y0tjk",
  authDomain: "anonymous-app-32575.firebaseapp.com",
  projectId: "anonymous-app-32575",
  storageBucket: "anonymous-app-32575.appspot.com",
  messagingSenderId: "730352688279",
  appId: "1:730352688279:web:719129794d1d5309315dd2"
};
firebase.initializeApp(firebaseConfig);

const db = admin.database();

app.use(bodyParser.json());

// Input validation middleware
function validateInput(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  };
}

// Authentication middleware
async function authenticateUser(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Define admin user
app.post('/define-admin', async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    res.status(200).json({ message: `User with UID ${uid} is now an admin` });
  } catch (error) {
    console.error(`Error defining admin: ${error}`);
    res.status(500).json({ message: 'Error defining admin user' });
  }
});

// Google OAuth 2.0 authentication
app.get('/auth/google', (req, res) => {
  const provider = new firebase.auth.GoogleAuthProvider();
  res.redirect(auth.signInWithRedirect(provider));
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const result = await auth.getRedirectResult();
    const token = await result.user.getIdToken();
    res.status(200).json({ token });
  } catch (error) {
    console.error(`Error authenticating with Google: ${error}`);
    res.status(500).json({ message: 'Error authenticating with Google' });
  }
});

// Register a new user
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userRecord = await admin.auth().createUser({ email, password });
    res.status(201).json({ message: 'User created successfully', uid: userRecord.uid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const token = await userCredential.user.getIdToken();
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// Send an anonymous message
app.post('/messages/anonymous', authenticateUser, async (req, res) => {
  try {
    const { text, recipientId } = req.body;
    const messageRef = db.ref('messages').push();
    await messageRef.set({
      text,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      senderId: null,
      recipientId
    });
    res.status(201).json({ message: 'Anonymous message sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Get messages for a recipient
app.get('/messages/:recipientId', authenticateUser, async (req, res) => {
  try {
    const recipientId = req.params.recipientId;
    const messagesRef = db.ref('messages');
    const snapshot = await messagesRef.orderByChild('recipientId').equalTo(recipientId).once('value');
    res.status(200).json(snapshot.val());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving messages' });
  }
});

// Create a new message
app.post('/messages', authenticateUser, async (req, res) => {
  try {
    const { text, recipientId } = req.body;
    const messageRef = db.ref('messages').push();
    await messageRef.set({
      text,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      senderId: req.user.uid,
      recipientId
    });
    res.status(201).json({ message: 'Message created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating message' });
  }
});

// Get all messages
app.get('/messages', authenticateUser, async (req, res) => {
  try {
    const messagesRef = db.ref('messages');
    const snapshot = await messagesRef.once('value');
    res.status(200).json(snapshot.val());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving messages' });
  }
});

// Get a specific message
app.get('/messages/:id', authenticateUser, async (req, res) => {
  try {
    const id = req.params.id;
    const messageRef = db.ref(`messages/${id}`);
    const snapshot = await messageRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.status(200).json(snapshot.val());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving message' });
  }
});

// Update a message
app.put('/messages/:id', authenticateUser, async (req, res) => {
  try {
    const id = req.params.id;
    const { text } = req.body;
    const messageRef = db.ref(`messages/${id}`);
    const snapshot = await messageRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Message not found' });
    }
    await messageRef.update({ text });
    res.status(200).json({ message: 'Message updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating message' });
  }
});

// Delete a message
app.delete('/messages/:id', authenticateUser, async (req, res) => {
  try {
    const id = req.params.id;
    const messageRef = db.ref(`messages/${id}`);
    const snapshot = await messageRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Message not found' });
    }
    await messageRef.remove();
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

// Create a node in the Realtime Database
db.ref('users').child('anonymous').set({
  username: 'anonymous',
  email: 'anonymous@example.com',
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
