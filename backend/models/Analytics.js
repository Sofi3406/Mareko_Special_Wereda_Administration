const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  reportAnalytics: {
    totalReports: Number,
    resolvedReports: Number,
    pendingReports: Number,
    averageResolutionTime: Number,
    categoryBreakdown: [{
      category: String,
      count: Number,
      resolved: Number
    }]
  },
  userAnalytics: {
    totalUsers: Number,
    activeUsers: Number,
    roleDistribution: {
      residents: Number,
      officers: Number,
      woredaAdmins: Number,
      subcityAdmins: Number
    }
  },
  woredaPerformance: [{
    woredaName: String,
    reportCount: Number,
    resolutionRate: Number,
    averageResolutionDays: Number
  }],
  departmentPerformance: [{
    department: String,
    totalReports: Number,
    resolved: Number,
    pending: Number,
    averageDaysToResolve: Number
  }],
  systemMetrics: {
    uptime: Number,
    averageResponseTime: Number,
    storageUsage: Number
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Analytics', analyticsSchema);