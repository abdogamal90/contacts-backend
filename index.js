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
app.locals.io = io; // expose io to controllers if needed

const editingContacts = {};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('startEditing', ({ contactId, username }) => {
    editingContacts[contactId] = { socketId: socket.id, username };
    io.emit('editingStatusChanged', { contactId, isEditing: true, username });
  });

  socket.on('stopEditing', ({ contactId }) => {
    const editor = editingContacts[contactId];
    const username = editor?.username;
    delete editingContacts[contactId];
    io.emit('editingStatusChanged', { contactId, isEditing: false, username });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    for (const [contactId, editor] of Object.entries(editingContacts)) {
      if (editor.socketId === socket.id) {
        const username = editor.username;
        delete editingContacts[contactId];
        io.emit('editingStatusChanged', { contactId, isEditing: false, username });
      }
    }
  });
});

// Middleware
app.use(cors());
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
    await db(); // if db() returns a promise; if not, keep as db();
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