const express = require('express');
const cors = require('cors');
const contactRoutes = require('./routes/contactRoutes');
const dotenv = require('dotenv').config();
const loginRoutes = require('./routes/loginRoutes');
const userRoutes = require('./routes/userRoutes');
const {verifyToken, rbac, authToken} = require('./middleware/loginMiddleware');
const socketIo = require('socket.io');
const db = require('./db');
const errorHandler = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured');
}


const app = express();
db();

// Ensure Contact indexes on startup
const Contact = require('./models/Contact');
(async () => {
  try {
    await Contact.syncIndexes(); // drops obsolete indexes and creates the defined ones
    console.log('Contact indexes synced');
  } catch (e) {
    console.error('Failed to sync Contact indexes:', e.message);
    // Optionally: process.exit(1) if you want to fail fast on index errors
  }
})();

// Initialize Socket.io
const server = require('http').createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});
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

// Error-handling middleware (must come after routes)
app.use(errorHandler);


// Start the server
const PORT = process.env.PORT || 8000
server.listen(PORT, () => {
  console.log(`localhost:${PORT}`);
});