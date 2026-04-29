// server.js
require('dotenv').config();

const http = require('http');
const socketIo = require('socket.io');
const config = require('./config');
const app = require('./app');
const connectDB = require('./db');
const initSocket = require('./socketHandler');
const Contact = require('./models/Contact');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' },
});

initSocket(io, app);

(async () => {
  try {
    await connectDB();
    console.log('MongoDB connected');
    await Contact.syncIndexes();
    console.log('Contact indexes synced');

    server.listen(config.port, () => {
      console.log(`Listening on port ${config.port}`);
      console.log(`Server is running on http://localhost:${config.port}`);
    });
  } catch (e) {
    console.error('Startup failure:', e.message);
    process.exit(1);
  }
})();
