const mongoose = require('mongoose');

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 20;

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  notes: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, onDelete: 'CASCADE' },

  // New tagging & classification fields
  tags: {
    type: [String],
    default: [],
    validate: [
      {
        validator: function (arr) {
          // max tags
          return Array.isArray(arr) && arr.length <= MAX_TAGS;
        },
        message: `A contact can have at most ${MAX_TAGS} tags`
      },
      {
        validator: function (arr) {
          // unique values within array
          if (!Array.isArray(arr)) return true;
          const lower = arr.map(t => (typeof t === 'string' ? t.toLowerCase().trim() : t));
          return new Set(lower).size === lower.length;
        },
        message: 'Tags must be unique within a contact'
      }
    ]
  },

  category: {
    type: String,
    enum: ['personal', 'work', 'family', 'business', 'other'],
    default: null,
  },

  isFavorite: { type: Boolean, default: false }

}, { timestamps: true }); 

// Ensure tags are stored lowercase & trimmed
ContactSchema.path('tags').set(function (tags) {
  if (!Array.isArray(tags)) return tags;
  return tags.map(t => (typeof t === 'string' ? t.toLowerCase().trim().slice(0, MAX_TAG_LENGTH) : t));
});

// Indexes to support efficient queries
ContactSchema.index({ owner: 1, name: 1 }, { unique: true });
ContactSchema.index({ owner: 1, isFavorite: 1 });
ContactSchema.index({ owner: 1, tags: 1 });
ContactSchema.index({ owner: 1, category: 1 });
ContactSchema.index({ name: 'text', phone: 'text', address: 'text', notes: 'text' });

module.exports = mongoose.model('Contact', ContactSchema);