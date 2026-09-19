const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    enum: ['Water', 'Road', 'Sanitation', 'Electricity', 'Health', 'Other'],
    required: true
  },
  customCategory: {
    type: String,
    trim: true,
    required: function() {
      return this.category === 'Other';
    }
  },
  relatedRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  kebele: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kebele'
  },
  woreda: {
    type: String,
    required: true
  },
  department: {
    type: String,
    enum: ['Water', 'Road', 'Sanitation', 'Electricity', 'Health', 'Other']
  },
  assignedOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: String
  },
  images: [String],
  updates: [{
    status: String,
    message: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for geospatial queries
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ status: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);