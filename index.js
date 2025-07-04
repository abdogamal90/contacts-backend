const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const contactRoutes = require('./routes/contactRoutes');
const dotenv = require('dotenv').config();
const authToken = require('./middleware/loginMiddleware');
const loginRoutes = require('./routes/loginRoutes');
const {verifyToken, rbac} = require('./middleware/loginMiddleware');
const socketIo = require('socket.io');

const app = express();

// Initialize Socket.io
const server = require('http').createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});
const editingContacts = {}; // { contactId: username }

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
    // Optional: clean up editingContacts if needed
  });
});

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
server.listen(PORT, () => {
  console.log(`localhost:${PORT}`);
});