const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    trim: true,
    uppercase: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  responsibilities: [{
    type: String,
    trim: true
  }],
  contactPhone: String,
  contactEmail: String,
  officeLocation: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

departmentSchema.index({ isActive: 1, name: 1 });

module.exports = mongoose.model('Department', departmentSchema);
