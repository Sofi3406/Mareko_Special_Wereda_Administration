const mongoose = require('mongoose');

const kebeleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Kebele name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Kebele code is required'],
    trim: true,
    uppercase: true
  },
  woreda: {
    type: String,
    required: [true, 'Woreda is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  contactPhone: String,
  contactEmail: String,
  administrator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

kebeleSchema.index({ woreda: 1, code: 1 }, { unique: true });
kebeleSchema.index({ woreda: 1, isActive: 1 });

module.exports = mongoose.model('Kebele', kebeleSchema);
