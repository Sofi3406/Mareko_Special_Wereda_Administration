const Kebele = require('../models/Kebele');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { buildWoredaRegex, isSameWoreda } = require('../utils/woreda');

const adminRoles = ['woreda_admin', 'super_admin'];

exports.getKebeles = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.includeInactive !== 'true') query.isActive = true;
    if (req.user?.role === 'woreda_admin') {
      const woredaRegex = buildWoredaRegex(req.user.woreda);
      query.woreda = woredaRegex ? { $regex: woredaRegex } : req.user.woreda;
    } else if (req.query.woreda) {
      query.woreda = req.query.woreda;
    }

    const kebeles = await Kebele.find(query)
      .populate('administrator', 'fullName email')
      .sort('name');
    res.status(200).json({ success: true, count: kebeles.length, data: kebeles });
  } catch (err) {
    next(err);
  }
};

exports.getKebele = async (req, res, next) => {
  try {
    const kebele = await Kebele.findById(req.params.id).populate('administrator', 'fullName email');
    if (!kebele) return next(new ErrorResponse('Kebele not found', 404));
    if (req.user?.role === 'woreda_admin' && !isSameWoreda(kebele.woreda, req.user.woreda)) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    res.status(200).json({ success: true, data: kebele });
  } catch (err) {
    next(err);
  }
};

exports.createKebele = async (req, res, next) => {
  try {
    if (!adminRoles.includes(req.user.role))
      return next(new ErrorResponse('Not authorized', 403));
    if (req.user.role === 'woreda_admin' && !isSameWoreda(req.body.woreda, req.user.woreda)) {
      return next(new ErrorResponse('Can only create Kebeles in your Woreda', 403));
    }
    const kebele = await Kebele.create(req.body);
    res.status(201).json({ success: true, data: kebele });
  } catch (err) {
    next(err);
  }
};

exports.updateKebele = async (req, res, next) => {
  try {
    if (!adminRoles.includes(req.user.role))
      return next(new ErrorResponse('Not authorized', 403));
    const existingKebele = await Kebele.findById(req.params.id);
    if (!existingKebele) return next(new ErrorResponse('Kebele not found', 404));
    if (req.user.role === 'woreda_admin' && !isSameWoreda(existingKebele.woreda, req.user.woreda)) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    const allowed = ['name', 'code', 'description', 'contactPhone', 'contactEmail', 'administrator', 'isActive'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const kebele = await Kebele.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!kebele) return next(new ErrorResponse('Kebele not found', 404));
    res.status(200).json({ success: true, data: kebele });
  } catch (err) {
    next(err);
  }
};

exports.getKebeleStats = async (req, res, next) => {
  try {
    if (!adminRoles.includes(req.user.role))
      return next(new ErrorResponse('Not authorized', 403));
    const kebele = await Kebele.findById(req.params.id);
    if (!kebele) return next(new ErrorResponse('Kebele not found', 404));
    if (req.user.role === 'woreda_admin' && !isSameWoreda(kebele.woreda, req.user.woreda)) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    const Report = require('../models/Report');
    const ServiceRequest = require('../models/ServiceRequest');

    const [residents, serviceRequests, reports, complaints] = await Promise.all([
      User.countDocuments({ kebele: kebele._id, role: 'resident' }),
      ServiceRequest.countDocuments({ kebele: kebele._id }),
      Report.countDocuments({ kebele: kebele._id }),
      Report.countDocuments({ kebele: kebele._id, category: 'Other' })
    ]);

    res.status(200).json({
      success: true,
      data: { residents, serviceRequests, reports, complaints }
    });
  } catch (err) {
    next(err);
  }
};
