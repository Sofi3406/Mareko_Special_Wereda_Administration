const Report = require('../models/Report');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/emailService');
const { logAction } = require('./auditLogController');

const { buildWoredaRegex, normalizeWoreda, isSameWoreda } = require('../utils/woreda');
const {
  isOfficerAllowedForReport,
  buildOfficerReportQuery
} = require('../utils/officerReportAccess');

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private
exports.getReports = async (req, res, next) => {
  try {
    let query;
    const reqQuery = { ...req.query };
    
    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);
    
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    const parsedQuery = JSON.parse(queryStr);

    if (req.user.role === 'resident') {
      parsedQuery.residentId = req.user.id;
    }

    if (req.user.role === 'officer') {
      if (!req.user.department) {
        return next(new ErrorResponse('Officer department not configured', 403));
      }

      const woredaRegex = buildWoredaRegex(req.user.woreda);
      delete parsedQuery.department;
      delete parsedQuery.category;
      delete parsedQuery.woreda;
      Object.assign(parsedQuery, buildOfficerReportQuery(req.user));
      parsedQuery.woreda = woredaRegex ? { $regex: woredaRegex } : req.user.woreda;
    }

    if (req.user.role === 'woreda_admin') {
      const woredaRegex = buildWoredaRegex(req.user.woreda);
      parsedQuery.woreda = woredaRegex ? { $regex: woredaRegex } : req.user.woreda;
    }

    query = Report.find(parsedQuery)
      .populate('residentId', 'fullName email')
      .populate('kebele', 'name code');
    
    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    
    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Report.countDocuments(parsedQuery);
    
    query = query.skip(startIndex).limit(limit);
    
    // Execute query
    const reports = await query;
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: reports.length,
      pagination,
      data: reports
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private
exports.getReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('residentId', 'fullName email phone')
      .populate('kebele', 'name code')
      .populate('assignedOfficer', 'fullName email')
      .populate('updates.updatedBy', 'fullName role');
    
    if (!report) {
      return next(new ErrorResponse('Report not found', 404));
    }
    
    // Check if user is authorized to view this report
    const reportResidentId = report.residentId?._id || report.residentId;

    if (
      req.user.role === 'resident' &&
      (!reportResidentId || reportResidentId.toString() !== req.user.id)
    ) {
      return next(new ErrorResponse('Not authorized to access this report', 403));
    }
    
    if (req.user.role === 'officer' && !isOfficerAllowedForReport(req.user, report)) {
      return next(new ErrorResponse('Not authorized to access this report', 403));
    }

    if (
      req.user.role === 'woreda_admin' &&
      !isSameWoreda(req.user.woreda, report.woreda)
    ) {
      return next(new ErrorResponse('Not authorized to access this report', 403));
    }
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new report
// @route   POST /api/reports
// @access  Private
exports.createReport = async (req, res, next) => {
  try {
    // Add resident to req.body
    req.body.residentId = req.user.id;
    req.body.woreda = req.user.woreda;
    if (req.user.kebele) req.body.kebele = req.user.kebele;
    
    if (req.body.category === 'Other' && (!req.body.customCategory || !req.body.customCategory.trim())) {
      return next(new ErrorResponse('Please provide the category type', 400));
    }

    if (req.body.customCategory) {
      req.body.customCategory = req.body.customCategory.trim();
    }

    // Auto-assign department based on category
    const departmentMapping = {
      'Water': 'Water',
      'Road': 'Road',
      'Sanitation': 'Sanitation',
      'Electricity': 'Electricity',
      'Health': 'Health',
      'Other': 'Other'
    };
    
    req.body.department = departmentMapping[req.body.category] || 'Other';
    
    // Handle file uploads
    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => file.path);
    }

    if (req.body.location && typeof req.body.location === 'string') {
      req.body.location = {
        address: req.body.location
      };
    }
    
    const report = await Report.create(req.body);

    if (report.category === 'Other') {
      const woredaRegex = buildWoredaRegex(report.woreda);
      const woredaAdmins = await User.find({
        role: 'woreda_admin',
        isActive: true,
        ...(woredaRegex ? { woreda: { $regex: woredaRegex } } : {})
      });

      const io = req.app.get('io');

      await Promise.all(
        woredaAdmins.map(async (admin) => {
          if (admin.email) {
            const emailBody = `
              <h2>New Custom Category Report</h2>
              <p>A resident submitted a report with a custom category.</p>
              <p><strong>Woreda:</strong> ${report.woreda}</p>
              <p><strong>Custom Category:</strong> ${report.customCategory}</p>
              <p><strong>Title:</strong> ${report.title}</p>
              <p><a href="${process.env.FRONTEND_URL}/woreda-admin/reports/${report._id}">View Report</a></p>
            `;

            await sendEmail({
              email: admin.email,
              subject: 'Custom Category Report - Yegara',
              html: emailBody
            });
          }

          if (io) {
            io.to(`user-${admin._id.toString()}`).emit('notification', {
              type: 'custom_category_report',
              message: `Custom category report: ${report.customCategory}`,
              reportId: report._id
            });
          }
        })
      );
    }
    
    // Send notification to department officers
    const officerCandidates = await User.find({
      role: 'officer',
      department: report.department,
      isActive: true
    });

    const officers = officerCandidates.filter(
      (officer) => normalizeWoreda(officer.woreda) === normalizeWoreda(report.woreda)
    );
    
    if (officers.length > 0) {
      const message = `
        <h2>New Report Submitted</h2>
        <p>A new report has been submitted in your department (${report.department}).</p>
        <p><strong>Title:</strong> ${report.title}</p>
        <p><strong>Category:</strong> ${report.category}</p>
        <p><strong>Description:</strong> ${report.description.substring(0, 100)}...</p>
        <p><a href="${process.env.FRONTEND_URL}/officer/reports/${report._id}">View Report</a></p>
      `;
      
      officers.forEach(async (officer) => {
        await sendEmail({
          email: officer.email,
          subject: `New ${report.category} Report - Yegara System`,
          html: message
        });
      });
    }
    
    res.status(201).json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private
exports.updateReport = async (req, res, next) => {
  try {
    let report = await Report.findById(req.params.id);
    
    if (!report) {
      return next(new ErrorResponse('Report not found', 404));
    }
    
    if (req.user.role === 'resident') {
      return next(new ErrorResponse('Residents cannot update issue workflow data', 403));
    }
    
    if (req.user.role === 'officer') {
      if (!req.user.department) {
        return next(new ErrorResponse('Officer department not configured', 403));
      }

      if (!isOfficerAllowedForReport(req.user, report)) {
        return next(
          new ErrorResponse(
            'You can only update reports for your department in your woreda',
            403
          )
        );
      }

      // Officers can only update status and add updates
      const allowedUpdates = ['status', 'updates', 'assignedOfficer', 'updateMessage'];
      Object.keys(req.body).forEach(key => {
        if (!allowedUpdates.includes(key)) {
          delete req.body[key];
        }
      });
    }

    if (
      req.user.role === 'woreda_admin' &&
      !isSameWoreda(req.user.woreda, report.woreda)
    ) {
      return next(new ErrorResponse('Not authorized to update this report', 403));
    }
    
    const previousStatus = report.status;

    // Add update history if status is changing
    if (req.body.status && req.body.status !== previousStatus) {
      if (!req.body.updates) req.body.updates = [];
      
      req.body.updates.push({
        status: req.body.status,
        message: req.body.updateMessage || `Status changed to ${req.body.status}`,
        updatedBy: req.user.id
      });
      
      // Set resolvedAt if status is 'Resolved'
      if (req.body.status === 'Resolved') {
        req.body.resolvedAt = new Date();
      }
    }
    
    // Handle file uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      req.body.images = [...report.images, ...newImages];
    }
    
    report = await Report.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    // Send notification to resident if status changed
    if (req.body.status && req.body.status !== previousStatus) {
      const resident = await User.findById(report.residentId);
      
      if (resident) {
        await Notification.create({
          recipient: resident._id,
          actor: req.user.id,
          type: 'report_status_updated',
          message: `Your issue "${report.title}" is now ${report.status}.`,
          metadata: { reportId: report._id, status: report.status }
        });

        const message = `
          <h2>Report Status Updated</h2>
          <p>Your report "${report.title}" status has been updated to <strong>${report.status}</strong>.</p>
          <p><a href="${process.env.FRONTEND_URL}/resident/reports/${report._id}">View Details</a></p>
        `;
        
        await sendEmail({
          email: resident.email,
          subject: `Report Status Updated - ${report.title}`,
          html: message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return next(new ErrorResponse('Report not found', 404));
    }
    
    if (req.user.role === 'resident' && report.residentId.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this report', 403));
    }

    if (req.user.role === 'officer') {
      return next(new ErrorResponse('Not authorized to delete reports', 403));
    }

    if (
      req.user.role === 'woreda_admin' &&
      !isSameWoreda(req.user.woreda, report.woreda)
    ) {
      return next(new ErrorResponse('Not authorized to delete this report', 403));
    }
    
    await report.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get reports by woreda
// @route   GET /api/reports/woreda/:woreda
// @access  Private (Admin)
exports.getReportsByWoreda = async (req, res, next) => {
  try {
    const woredaRegex = buildWoredaRegex(req.params.woreda);
    const reports = await Report.find(woredaRegex ? { woreda: { $regex: woredaRegex } } : { woreda: req.params.woreda })
      .populate('residentId', 'fullName email')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get reports by department
// @route   GET /api/reports/department/:department
// @access  Private (Officer)
exports.getReportsByDepartment = async (req, res, next) => {
  try {
    if (req.user.role === 'officer') {
      if (!req.user.department) {
        return next(new ErrorResponse('Officer department not configured', 403));
      }

      if (req.params.department !== req.user.department) {
        return next(new ErrorResponse('Not authorized to access this department', 403));
      }
    }

    const department = req.user.role === 'officer' ? req.user.department : req.params.department;
    const query = {
      $or: [
        { department },
        { department: { $in: [null, ''] }, category: department }
      ]
    };

    if (req.user.role === 'officer') {
      const woredaRegex = buildWoredaRegex(req.user.woreda);
      query.woreda = woredaRegex ? { $regex: woredaRegex } : req.user.woreda;
    }

    const reports = await Report.find(query)
      .populate('residentId', 'fullName email')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's reports
// @route   GET /api/reports/my-reports
// @access  Private
exports.getMyReports = async (req, res, next) => {
  try {
    let query;
    
    if (req.user.role === 'resident') {
      query = { residentId: req.user.id };
    } else if (req.user.role === 'officer') {
      if (!req.user.department) {
        return next(new ErrorResponse('Officer department not configured', 403));
      }

      const woredaRegex = buildWoredaRegex(req.user.woreda);
      query = {
        ...buildOfficerReportQuery(req.user),
        woreda: woredaRegex ? { $regex: woredaRegex } : req.user.woreda
      };
    } else if (req.user.role === 'woreda_admin') {
      const woredaRegex = buildWoredaRegex(req.user.woreda);
      query = woredaRegex ? { woreda: { $regex: woredaRegex } } : { woreda: req.user.woreda };
    }
    
    const reports = await Report.find(query)
      .populate('residentId', 'fullName email')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get public updates for the resident's woreda
// @route   GET /api/reports/public-updates
// @access  Private
exports.getPublicUpdates = async (req, res, next) => {
  try {
    const woreda = req.user.woreda || req.query.woreda;

    if (!woreda) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const woredaRegex = buildWoredaRegex(woreda);
    const query = {
      'updates.0': { $exists: true },
      ...(woredaRegex ? { woreda: { $regex: woredaRegex } } : { woreda })
    };

    const reports = await Report.find(query)
      .populate('residentId', 'fullName email')
      .populate('assignedOfficer', 'fullName email department')
      .populate('updates.updatedBy', 'fullName role department')
      .sort('-createdAt');

    const updates = reports
      .map((report) => {
        const latestUpdate = [...(report.updates || [])].sort(
          (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        )[0];

        if (!latestUpdate) {
          return null;
        }

        return {
          _id: `${report._id}-${latestUpdate.timestamp || report.createdAt}`,
          reportId: report._id,
          reportTitle: report.title,
          reportCategory: report.category,
          reportDepartment: report.department,
          woreda: report.woreda,
          reportStatus: report.status,
          createdAt: report.createdAt,
          resident: report.residentId,
          assignedOfficer: report.assignedOfficer,
          latestUpdate
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.latestUpdate.timestamp || 0) - new Date(a.latestUpdate.timestamp || 0));

    res.status(200).json({
      success: true,
      count: updates.length,
      data: updates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Post update to report
// @route   POST /api/reports/:id/updates
// @access  Private (Officer)
exports.postUpdate = async (req, res, next) => {
  try {
    const { message } = req.body;
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return next(new ErrorResponse('Report not found', 404));
    }
    
    if (req.user.role === 'officer') {
      if (!req.user.department) {
        return next(new ErrorResponse('Officer department not configured', 403));
      }

      if (!isOfficerAllowedForReport(req.user, report)) {
        return next(
          new ErrorResponse(
            'You can only post updates for your department in your woreda',
            403
          )
        );
      }
    }

    if (
      req.user.role === 'woreda_admin' &&
      !isSameWoreda(req.user.woreda, report.woreda)
    ) {
      return next(new ErrorResponse('Not authorized to update this report', 403));
    }
    
    const update = {
      status: report.status,
      message,
      updatedBy: req.user.id
    };
    
    report.updates.push(update);
    await report.save();
    await logAction({ actor: req.user.id, action: 'updated community issue', entity: 'Report', entityId: report._id, metadata: { status: report.status, priority: report.priority } });
    
    res.status(200).json({
      success: true,
      data: update
    });
  } catch (err) {
    next(err);
  }
};