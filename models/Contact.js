const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  notes: { type: String },
}, { timestamps: true }); 

module.exports = mongoose.model('Contact', ContactSchema);