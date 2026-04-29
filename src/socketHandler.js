// Socket.io connection and editing status handler
module.exports = function initSocket(io, app) {
  // expose io to controllers if needed
  app.locals.io = io;

  const editingContacts = {};

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('startEditing', ({ contactId, username }) => {
      editingContacts[contactId] = { socketId: socket.id, username };
      io.emit('editingStatusChanged', { contactId, isEditing: true, username });
    });

    socket.on('stopEditing', ({ contactId }) => {
      const editor = editingContacts[contactId];
      const username = editor && editor.username;
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

  // return internal state for optional inspection or testing
  return { editingContacts };
};
