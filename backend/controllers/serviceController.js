const Service = require('../models/Service');
const ServiceRequest = require('../models/ServiceRequest');
const ErrorResponse = require('../utils/errorResponse');
const { isSameWoreda } = require('../utils/woreda');
const { logAction } = require('./auditLogController');

const adminRoles = ['woreda_admin', 'super_admin'];
const staffRoles = ['officer', 'kebele_admin', 'woreda_admin', 'super_admin'];

const canManageService = (user) => Boolean(user && adminRoles.includes(user.role));

exports.getServices = async (req, res, next) => {
  try {
    const query = { isActive: req.query.includeInactive === 'true' ? undefined : true };
    if (!query.isActive) delete query.isActive;
    if (req.query.department) query.department = req.query.department;
    if (req.query.search) query.name = { $regex: req.query.search.trim(), $options: 'i' };

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const [services, total] = await Promise.all([
      Service.find(query).populate('department', 'name code').sort('name').skip((page - 1) * limit).limit(limit),
      Service.countDocuments(query)
    ]);

    res.status(200).json({ success: true, count: services.length, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, data: services });
  } catch (err) {
    next(err);
  }
};

exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate('department', 'name code description contactPhone contactEmail');
    if (!service || (!service.isActive && !canManageService(req.user))) {
      return next(new ErrorResponse('Service not found', 404));
    }
    res.status(200).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
};

exports.createService = async (req, res, next) => {
  try {
    if (!canManageService(req.user)) return next(new ErrorResponse('Not authorized to manage services', 403));
    const service = await Service.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    if (!canManageService(req.user)) return next(new ErrorResponse('Not authorized to manage services', 403));
    const allowed = ['name', 'description', 'department', 'requirements', 'requiredDocuments', 'procedure', 'estimatedProcessingDays', 'officeLocation', 'contactPhone', 'contactEmail', 'isActive'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const service = await Service.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!service) return next(new ErrorResponse('Service not found', 404));
    await logAction({ actor: req.user.id, action: 'updated service', entity: 'Service', entityId: service._id, metadata: { fields: Object.keys(updates) } });
    res.status(200).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
};

const buildRequestQuery = (user, queryParams) => {
  const query = {};
  if (user.role === 'resident') query.resident = user.id;
  if (user.role === 'officer') query.department = user.departmentRef || undefined;
  if (user.role === 'kebele_admin') query.kebele = user.kebele || undefined;
  if (user.role === 'woreda_admin') query.woreda = user.woreda;
  if (queryParams.status) query.status = queryParams.status;
  if (queryParams.department && adminRoles.includes(user.role)) query.department = queryParams.department;
  if (queryParams.kebele && ['kebele_admin', ...adminRoles].includes(user.role)) query.kebele = queryParams.kebele;
  Object.keys(query).forEach((key) => query[key] === undefined && delete query[key]);
  return query;
};

exports.getRequests = async (req, res, next) => {
  try {
    if (!staffRoles.includes(req.user.role) && req.user.role !== 'resident') return next(new ErrorResponse('Not authorized', 403));
    const query = buildRequestQuery(req.user, req.query);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const [requests, total] = await Promise.all([
      ServiceRequest.find(query)
        .populate('service', 'name description')
        .populate('department', 'name code')
        .populate('resident', 'fullName email phone')
        .populate('assignedOfficer', 'fullName email')
        .sort('-createdAt').skip((page - 1) * limit).limit(limit),
      ServiceRequest.countDocuments(query)
    ]);
    res.status(200).json({ success: true, count: requests.length, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, data: requests });
  } catch (err) {
    next(err);
  }
};

exports.getRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('service', 'name description requirements requiredDocuments procedure')
      .populate('department', 'name code')
      .populate('resident', 'fullName email phone')
      .populate('assignedOfficer', 'fullName email');
    if (!request) return next(new ErrorResponse('Service request not found', 404));
    const query = buildRequestQuery(req.user, {});
    const requestOwnerId = request.resident?._id || request.resident;
    const visible = req.user.role === 'super_admin' || (
      req.user.role === 'resident'
        ? String(requestOwnerId) === String(req.user.id)
        : Object.entries(query).every(([key, value]) => String(request[key]) === String(value))
    );
    if (!visible) return next(new ErrorResponse('Not authorized to access this request', 403));
    if (req.user.role === 'resident') request.internalNotes = undefined;
    res.status(200).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};

exports.createRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'resident') return next(new ErrorResponse('Only residents can submit service requests', 403));
    const service = await Service.findOne({ _id: req.body.service, isActive: true });
    if (!service) return next(new ErrorResponse('Active service not found', 404));
    const trackingNumber = await ServiceRequest.nextTrackingNumber();
    const request = await ServiceRequest.create({
      trackingNumber,
      service: service._id,
      resident: req.user.id,
      kebele: req.user.kebele,
      woreda: req.user.woreda,
      department: service.department,
      formData: req.body.formData || {},
      attachments: (req.files || []).map((file) => ({ fileName: file.originalname, filePath: file.path, mimeType: file.mimetype, size: file.size }))
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};

exports.updateRequest = async (req, res, next) => {
  try {
    if (!staffRoles.includes(req.user.role)) return next(new ErrorResponse('Not authorized to update service requests', 403));
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return next(new ErrorResponse('Service request not found', 404));
    if (req.user.role === 'officer' && String(request.department) !== String(req.user.departmentRef)) return next(new ErrorResponse('Not authorized to update this request', 403));
    if (req.user.role === 'kebele_admin' && String(request.kebele) !== String(req.user.kebele)) return next(new ErrorResponse('Not authorized to update this request', 403));
    if (req.user.role === 'woreda_admin' && !isSameWoreda(request.woreda, req.user.woreda)) return next(new ErrorResponse('Not authorized to update this request', 403));

    const { status, assignedOfficer, message, resolution, internalNote } = req.body;
    if (status) {
      request.status = status;
      request.residentUpdates.push({ status, message: message || `Request status updated to ${status}`, createdBy: req.user.id });
      if (status === 'RESOLVED') request.resolvedAt = new Date();
      if (status === 'CLOSED') request.closedAt = new Date();
    }
    if (assignedOfficer !== undefined) request.assignedOfficer = assignedOfficer || undefined;
    if (resolution !== undefined) request.resolution = resolution;
    if (internalNote) request.internalNotes.push({ note: internalNote, createdBy: req.user.id });
    await request.save();
    await logAction({ actor: req.user.id, action: 'updated service request', entity: 'ServiceRequest', entityId: request._id, metadata: { status, assignedOfficer } });
    res.status(200).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};
