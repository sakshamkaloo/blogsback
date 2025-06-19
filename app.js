// Backend: app.js
// require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');

// Use environment variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

const app = express();

app.use(cors());
app.use(bodyParser.json());

const client = new MongoClient(MONGO_URI);
let db, users, blogs;

client.connect().then(() => {
  db = client.db(DB_NAME);
  users = db.collection('users');
  blogs = db.collection('blogs');
  console.log('MongoDB connected');
});

// Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const exists = await users.findOne({ username });
  if (exists) return res.status(400).json({ message: 'User exists' });
  await users.insertOne({ username, password });
  res.json({ message: 'Registered successfully' });
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await users.findOne({ username, password });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  res.json({ username: user.username });
});

// Submit Blog
app.post('/api/blog', async (req, res) => {
  const { username, title, content } = req.body;
  await blogs.insertOne({ username, title, content, createdAt: new Date() });
  res.json({ message: 'Blog posted' });
});

// Get Blogs (with pagination)
app.get('/api/blogs', async (req, res) => {
  const page = parseInt(req.query.page || 1);
  const limit = 5;
  const skip = (page - 1) * limit;
  const data = await blogs.find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
  const total = await blogs.countDocuments();
  res.json({ blogs: data, totalPages: Math.ceil(total / limit) });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
