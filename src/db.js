const mongoose = require('mongoose');
const { mongoUrl } = require('./config');

/**
 * @returns {Promise<typeof mongoose>}
 */
function connectDB() {
  return mongoose.connect(mongoUrl);
}

module.exports = connectDB;
