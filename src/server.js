// server.js
require('dotenv').config();

const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');
const app = require('./app');
const connectDB = require('./db');
const initSocket = require('./socketHandler');
const Contact = require('./models/Contact');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: config.corsOrigins },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));

  try {
    socket.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch (_error) {
    return next(new Error('Invalid or expired token'));
  }
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
    });
  } catch (e) {
    console.error('Startup failure:', e.message);
    process.exit(1);
  }
})();
