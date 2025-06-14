const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const contactRoutes = require('./routes/contactRoutes');
const dotenv = require('dotenv').config();
const authToken = require('./middleware/loginMiddleware');
const loginRoutes = require('./routes/loginRoutes');
const {verifyToken, rbac} = require('./middleware/loginMiddleware');

const app = express();

// MongoDB Connection

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Middleware
app.use(cors());
app.use(express.json());
// Routes
app.use('/api/verify',loginRoutes);
app.use('/api/contacts',verifyToken, contactRoutes);
// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`localhost:${PORT}`);
});