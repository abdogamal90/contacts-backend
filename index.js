const express = require('express');
const cors = require('cors');
const contactRoutes = require('./routes/contactRoutes');
const dotenv = require('dotenv').config();
const loginRoutes = require('./routes/loginRoutes');
const {verifyToken, rbac, authToken} = require('./middleware/loginMiddleware');
const socketIo = require('socket.io');
const db = require('./db')

const app = express();
db();

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
app.use('/api/contacts',verifyToken, contactRoutes);
// Error-handling middleware (must come after routes)
app.use((err, req, res, next) => {
  // Log the full error on the server for debugging
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start the server
const PORT = process.env.PORT || 8000
server.listen(PORT, () => {
  console.log(`localhost:${PORT}`);
});