const express = require('express');
const cors = require('cors');
const contactRoutes = require('./routes/contactRoutes');
require('dotenv').config(); // load env, no unused variable
const loginRoutes = require('./routes/loginRoutes');
const userRoutes = require('./routes/userRoutes');
const { verifyToken } = require('./middleware/loginMiddleware'); // remove unused rbac/authToken
const socketIo = require('socket.io');
const db = require('./db');
const errorHandler = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured');
}

const app = express();

// Initialize Socket.io
const server = require('http').createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }, // tighten in production
});

// Move socket handling to a dedicated module
const initSocket = require('./socketHandler');
// initialize socket handling (this will set app.locals.io)
initSocket(io, app);


// Middleware
app.use(cors({
  origin: ['http://localhost:4200'], // add your frontend origin(s)
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', loginRoutes);
app.use('/api/contacts', verifyToken, contactRoutes);
app.use('/api/user', verifyToken, userRoutes);

// 404 JSON handler (before error handler)
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not Found' });
});

// Error-handling middleware (must come after routes)
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 8000;

// Ensure DB and indexes are ready before starting the server
(async () => {
  try {
    await db();
    console.log('MongoDB connected');
    const Contact = require('./models/Contact');
    await Contact.syncIndexes();
    console.log('Contact indexes synced');

    server.listen(PORT, () => {
      console.log(`localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Startup failure:', e.message);
    process.exit(1);
  }
})();