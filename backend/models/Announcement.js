const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  category: {
    type: String,
    default: 'General'
  },
  image: {
    type: String
  },
  audienceRoles: {
    type: [String],
    default: ['all']
  },
  woreda: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

announcementSchema.index({ woreda: 1, createdAt: -1 });
announcementSchema.index({ audienceRoles: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
