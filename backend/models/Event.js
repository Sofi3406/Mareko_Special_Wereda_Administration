const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: String,
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  endDate: Date,
  location: {
    type: String,
    required: [true, 'Event location is required']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  woreda: {
    type: String,
    required: true
  },
  category: String,
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  registrationTickets: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    fullName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['user', 'guest'],
      default: 'user'
    },
    entranceCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  guestAttendees: [{
    fullName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxAttendees: Number,
  attendeeCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  images: [String],
  meetingLink: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

eventSchema.pre('save', function syncAttendeeCount(next) {
  const ticketCount = Array.isArray(this.registrationTickets) ? this.registrationTickets.length : 0;
  const residentCount = Array.isArray(this.attendees) ? this.attendees.length : 0;
  const guestCount = Array.isArray(this.guestAttendees) ? this.guestAttendees.length : 0;
  this.attendeeCount = Math.max(ticketCount, residentCount + guestCount);
  next();
});

module.exports = mongoose.model('Event', eventSchema);