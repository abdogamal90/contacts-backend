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

    server.listen(config.port, '0.0.0.0', () => {
      console.log(`Listening on 0.0.0.0:${config.port} (reachable from outside this machine)`);
    });
  } catch (e) {
    console.error('Startup failure:', e.message);
    process.exit(1);
  }
})();
