const fs = require('fs');
const path = require('path');
const Resource = require('../models/Resource');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

const toWebPath = (filePath = '') => filePath.replace(/\\/g, '/');
const resolveResourceFilePath = (fileUrl = '') => {
  const normalized = toWebPath(String(fileUrl).trim());
  const strippedLeadingSlash = normalized.replace(/^\/+/, '');
  const uploadsRelative = normalized.replace(/^.*?(uploads\/)/i, 'uploads/');
  const uploadsRelativeStripped = uploadsRelative.replace(/^\/+/, '');

  const candidates = [
    normalized,
    strippedLeadingSlash,
    uploadsRelative,
    uploadsRelativeStripped,
    path.resolve(__dirname, '..', strippedLeadingSlash),
    path.resolve(__dirname, '..', uploadsRelativeStripped)
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.resolve(__dirname, '..', uploadsRelativeStripped || strippedLeadingSlash || normalized);
};
const { buildWoredaRegex } = require('../utils/woreda');
const STAFF_RESOURCE_ROLES = ['officer', 'woreda_admin', 'super_admin'];

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
exports.getResources = async (req, res, next) => {
  try {
    let query;
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    const baseFilter = JSON.parse(queryStr);

    if (req.user.role === 'resident') {
      const staffIds = await User.find({ role: { $in: STAFF_RESOURCE_ROLES } }).distinct('_id');
      const visibilityFilter = {
        $or: [
          { isPublic: true },
          { isPublic: { $exists: false } },
          { uploadedBy: { $in: staffIds } }
        ]
      };

      if (req.user.woreda) {
        const woredaRegex = buildWoredaRegex(req.user.woreda);
        baseFilter.$and = [
          visibilityFilter,
          {
            $or: [
              woredaRegex ? { woreda: { $regex: woredaRegex } } : { woreda: req.user.woreda },
              { woreda: { $exists: false } },
              { woreda: null }
            ]
          }
        ];
      } else {
        Object.assign(baseFilter, visibilityFilter);
      }
    }

    query = Resource.find(baseFilter).populate('uploadedBy', 'fullName email');

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
    const total = await Resource.countDocuments(baseFilter);

    query = query.skip(startIndex).limit(limit);

    const resources = await query;

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
      count: resources.length,
      pagination,
      data: resources
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
exports.getResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('uploadedBy', 'fullName email role');

    if (!resource) {
      return next(new ErrorResponse('Resource not found', 404));
    }

    if (req.user.role === 'resident') {
      const isStaffUpload = STAFF_RESOURCE_ROLES.includes(resource.uploadedBy?.role);

      if (resource.isPublic === false && !isStaffUpload) {
        return next(new ErrorResponse('Not authorized to access this resource', 403));
      }
    }

    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new resource
// @route   POST /api/resources
// @access  Private (Officer/Admin)
exports.createResource = async (req, res, next) => {
  try {
    req.body.uploadedBy = req.user.id;

    if (req.user.woreda && !req.body.woreda) {
      req.body.woreda = req.user.woreda;
    }

    if (req.file) {
      req.body.fileUrl = toWebPath(req.file.path);
      req.body.fileName = req.file.originalname;
      req.body.fileType = req.file.mimetype;
      req.body.fileSize = req.file.size;
    }

    if (!req.body.fileUrl) {
      return next(new ErrorResponse('Resource file is required', 400));
    }

    const resource = await Resource.create(req.body);

    res.status(201).json({
      success: true,
      data: resource
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private (Officer/Admin)
exports.updateResource = async (req, res, next) => {
  try {
    let resource = await Resource.findById(req.params.id);

    if (!resource) {
      return next(new ErrorResponse('Resource not found', 404));
    }

    if (resource.uploadedBy.toString() !== req.user.id && req.user.role !== 'super_admin') {
      return next(new ErrorResponse('Not authorized to update this resource', 403));
    }

    if (req.file) {
      req.body.fileUrl = toWebPath(req.file.path);
      req.body.fileName = req.file.originalname;
      req.body.fileType = req.file.mimetype;
      req.body.fileSize = req.file.size;
    }

    resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (Officer/Admin)
exports.deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return next(new ErrorResponse('Resource not found', 404));
    }

    if (resource.uploadedBy.toString() !== req.user.id && req.user.role !== 'super_admin') {
      return next(new ErrorResponse('Not authorized to delete this resource', 403));
    }

    await resource.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Download resource file
// @route   GET /api/resources/:id/download
// @access  Private
exports.downloadResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return next(new ErrorResponse('Resource not found', 404));
    }

    if (req.user.role === 'resident') {
      const uploadedBy = await User.findById(resource.uploadedBy).select('role');
      const isStaffUpload = STAFF_RESOURCE_ROLES.includes(uploadedBy?.role);

      if (resource.isPublic === false && !isStaffUpload) {
        return next(new ErrorResponse('Not authorized to access this resource', 403));
      }
    }

    const filePath = resolveResourceFilePath(resource.fileUrl);

    if (!fs.existsSync(filePath)) {
      return next(new ErrorResponse('File not found on server', 404));
    }

    resource.downloadCount += 1;
    await resource.save();

    return res.download(filePath, resource.fileName || undefined);
  } catch (err) {
    next(err);
  }
};

