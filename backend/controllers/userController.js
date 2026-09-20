const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { buildWoredaRegex, isSameWoreda } = require('../utils/woreda');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (woreda_admin, subcity_admin)
exports.getUsers = async (req, res, next) => {
  try {
    if (!['super_admin', 'woreda_admin'].includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    const query = {};

    if (req.user.role === 'woreda_admin') {
      const woredaRegex = buildWoredaRegex(req.user.woreda);
      query.woreda = woredaRegex ? { $regex: woredaRegex } : req.user.woreda;
    }

    if (req.query.role) query.role = req.query.role;
    if (req.query.department) query.department = req.query.department;
    if (req.query.kebele) query.kebele = req.query.kebele;

    if (req.user.role === 'super_admin' && req.query.woreda && req.query.woreda !== 'all') {
      const woredaRegex = buildWoredaRegex(req.query.woreda);
      query.woreda = woredaRegex ? { $regex: woredaRegex } : req.query.woreda;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('kebele', 'name code woreda')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return next(new ErrorResponse('User not found', 404));

    if (req.user.role === 'resident' && req.user.id !== req.params.id) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    if (req.user.role === 'woreda_admin' && !isSameWoreda(user.woreda, req.user.woreda)) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private (woreda_admin, subcity_admin)
exports.createUser = async (req, res, next) => {
  try {
    if (!['super_admin', 'woreda_admin'].includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized to create users', 403));
    }

    const { email, role, woreda, password, fullName, phone, department, customDepartment, kebele } = req.body;

    // Role hierarchy enforcement
    if (req.user.role === 'super_admin' && role !== 'woreda_admin') {
      return next(new ErrorResponse('System Admin can only create Woreda Admins', 403));
    }
    if (req.user.role === 'woreda_admin' && !['officer', 'kebele_admin'].includes(role)) {
      return next(new ErrorResponse('Woreda Admin can only create Officers and Kebele Admins', 403));
    }

    // Woreda admin can only create users in their own woreda
    if (req.user.role === 'woreda_admin' && woreda && !isSameWoreda(woreda, req.user.woreda)) {
      return next(new ErrorResponse('Can only create users in your woreda', 403));
    }

    const existing = await User.findOne({ email });
    if (existing) return next(new ErrorResponse('A user with this email already exists', 400));

    if (!password || password.length < 6) {
      return next(new ErrorResponse('Password must be at least 6 characters', 400));
    }

    const accessCode = role === 'officer' ? User.generateAccessCode() : undefined;

    const userData = {
      fullName,
      email,
      password,
      phone,
      role,
      woreda: woreda || (req.user.role === 'woreda_admin' ? req.user.woreda : 'Mareqo Wereda'),
      isActive: true,
      mustChangePassword: false
    };

    if (role === 'officer') {
      userData.department = department;
      userData.customDepartment = customDepartment;
      userData.accessCode = accessCode;
    }

    if (role === 'kebele_admin' && kebele) {
      userData.kebele = kebele;
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        woreda: user.woreda,
        department: user.department,
        accessCode: user.accessCode
      },
      message: 'User created successfully. They can now log in with their email and password.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (admin or self)
exports.updateUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);
    if (!user) return next(new ErrorResponse('User not found', 404));

    const isSelf = req.user.id === req.params.id;
    const isAdmin = ['woreda_admin', 'super_admin'].includes(req.user.role);

    if (!isSelf && !isAdmin) return next(new ErrorResponse('Not authorized', 403));

    if (req.user.role === 'woreda_admin' && !isSameWoreda(user.woreda, req.user.woreda)) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    const profileFields = ['fullName', 'email', 'phone', 'profileImage'];
    const adminFields = ['fullName', 'email', 'phone', 'profileImage', 'isActive', 'role', 'woreda', 'department', 'kebele'];
    const allowed = isAdmin
      ? (req.user.role === 'woreda_admin'
        ? adminFields.filter(field => !['role', 'woreda'].includes(field))
        : adminFields)
      : profileFields;

    if (req.user.role === 'woreda_admin' && ('role' in req.body || 'woreda' in req.body)) {
      return next(new ErrorResponse('Woreda Admins cannot change roles or Woreda ownership', 403));
    }

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    if (Object.keys(updates).length === 0) {
      return next(new ErrorResponse('No permitted fields provided', 400));
    }

    user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (woreda_admin, subcity_admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorResponse('User not found', 404));

    if (!['super_admin', 'woreda_admin'].includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    if (req.user.role === 'woreda_admin' && !isSameWoreda(user.woreda, req.user.woreda)) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    if (req.user.id === req.params.id) {
      return next(new ErrorResponse('Cannot delete your own account', 400));
    }

    await user.deleteOne();
    res.status(200).json({ success: true, data: {}, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get users by woreda
// @route   GET /api/users/woreda/:woreda
exports.getUsersByWoreda = async (req, res, next) => {
  try {
    if (!['super_admin', 'woreda_admin'].includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized', 403));
    }
    if (req.user.role === 'woreda_admin' && !isSameWoreda(req.params.woreda, req.user.woreda)) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    const woredaRegex = buildWoredaRegex(req.params.woreda);
    const users = await User.find(
      woredaRegex ? { woreda: { $regex: woredaRegex } } : { woreda: req.params.woreda }
    ).select('-password');

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

// @desc    Get users by role
// @route   GET /api/users/role/:role
exports.getUsersByRole = async (req, res, next) => {
  try {
    if (!['super_admin', 'woreda_admin'].includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized', 403));
    }

    const query = { role: req.params.role };
    if (req.user.role === 'woreda_admin') {
      const woredaRegex = buildWoredaRegex(req.user.woreda);
      query.woreda = woredaRegex ? { $regex: woredaRegex } : req.user.woreda;
    }

    const users = await User.find(query).select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};
