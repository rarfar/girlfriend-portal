const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  severity: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  mood: {
    type: String,
    required: true,
    enum: ['happy', 'sad', 'angry', 'confused', 'cute', 'yucky', 'professional', 'oop', 'magical']
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Grievance', grievanceSchema);
