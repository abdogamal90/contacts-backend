const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  notes: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, onDelete: 'CASCADE' },
}, { timestamps: true }); 

ContactSchema.index({ owner: 1, name: 1 }, { unique: true });


module.exports = mongoose.model('Contact', ContactSchema);