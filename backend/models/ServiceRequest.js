const mongoose = require('mongoose');

const REQUEST_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_FOR_INFORMATION',
  'RESOLVED',
  'REJECTED',
  'CLOSED'
];

const serviceRequestSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  kebele: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kebele'
  },
  woreda: {
    type: String,
    required: true,
    index: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
  },
  formData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  attachments: [{
    fileName: String,
    filePath: String,
    mimeType: String,
    size: Number
  }],
  status: {
    type: String,
    enum: REQUEST_STATUSES,
    default: 'SUBMITTED',
    index: true
  },
  assignedOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  residentUpdates: [{
    status: { type: String, enum: REQUEST_STATUSES },
    message: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  internalNotes: [{
    note: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  resolution: String,
  resolvedAt: Date,
  closedAt: Date
}, { timestamps: true });

serviceRequestSchema.index({ resident: 1, createdAt: -1 });
serviceRequestSchema.index({ department: 1, status: 1, createdAt: -1 });

serviceRequestSchema.statics.nextTrackingNumber = async function() {
  const year = new Date().getFullYear();
  const latest = await this.findOne({ trackingNumber: new RegExp(`^REQ-${year}-`) })
    .sort({ createdAt: -1 })
    .select('trackingNumber')
    .lean();
  const sequence = latest ? Number(latest.trackingNumber.split('-').pop()) + 1 : 1;
  return `REQ-${year}-${String(sequence).padStart(5, '0')}`;
};

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
module.exports.REQUEST_STATUSES = REQUEST_STATUSES;
