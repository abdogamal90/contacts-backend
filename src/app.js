const express = require('express');
const cors = require('cors');
const contactRoutes = require('./routes/contactRoutes');
const loginRoutes = require('./routes/loginRoutes');
const userRoutes = require('./routes/userRoutes');
const { verifyToken } = require('./middleware/loginMiddleware');
const errorHandler = require('./middleware/errorHandler');
const { corsOrigins } = require('./config');

const app = express();

// No auth / CORS — use for load balancers and `curl http://IP:PORT/health`
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (corsOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
  })
);
app.use(express.json());

app.use('/api/auth', loginRoutes);
app.use('/api/contacts', verifyToken, contactRoutes);
app.use('/api/user', verifyToken, userRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not Found' });
});

app.use(errorHandler);

module.exports = app;
