const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  grievance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grievance',
    required: true
  },
  reply: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Reply', replySchema);
