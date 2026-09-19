const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['resident', 'kebele_admin', 'officer', 'woreda_admin', 'super_admin'],
    required: true
  },
  woreda: {
    type: String,
    required: function() {
      return this.role === 'resident' || this.role === 'woreda_admin';
    }
  },
  kebele: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kebele'
  },
  departmentRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  customWoredaName: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    required: function() {
      return this.role === 'officer';
    }
  },
  customDepartment: {
    type: String,
    trim: true,
    required: function() {
      return this.role === 'officer' && this.department === 'Other';
    }
  },
  accessCode: {
    type: String,
    required: function() {
      return this.role === 'officer';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  activationToken: String,
  activationExpire: Date,
  profileImage: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d'
    }
  );
};

// Generate access code for officers
userSchema.statics.generateAccessCode = function() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

module.exports = mongoose.model('User', userSchema);