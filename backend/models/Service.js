const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true,
    maxlength: 5000
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  requirements: [{ type: String, trim: true }],
  requiredDocuments: [{ type: String, trim: true }],
  procedure: [{ type: String, trim: true }],
  estimatedProcessingDays: {
    type: Number,
    min: 0
  },
  officeLocation: String,
  contactPhone: String,
  contactEmail: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

serviceSchema.index({ isActive: 1, name: 1 });
serviceSchema.index({ department: 1, isActive: 1 });

module.exports = mongoose.model('Service', serviceSchema);
