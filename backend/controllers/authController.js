const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const crypto = require('crypto');
const Kebele = require('../models/Kebele');

const sendTokenResponse = (user, statusCode, res, extra = {}) => {
  const token = user.getSignedJwtToken();

  const cookieDays = Number(process.env.JWT_COOKIE_EXPIRE);
  const cookieTtlMs = Number.isFinite(cookieDays) ? cookieDays * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  const options = {
    expires: new Date(Date.now() + cookieTtlMs),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      woreda: user.woreda,
      kebele: user.kebele,
      department: user.department
    },
    ...extra
  });
};

// @desc    Register resident (self-registration)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, kebele } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return next(new ErrorResponse('User already exists', 400));

    const selectedKebele = await Kebele.findOne({ _id: kebele, isActive: true });
    if (!selectedKebele) return next(new ErrorResponse('Please select a valid kebele', 400));

    const user = await User.create({
      email,
      password,
      fullName,
      phone,
      role: 'resident',
      woreda: selectedKebele.woreda,
      kebele: selectedKebele._id,
      isActive: true
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) return next(new ErrorResponse('Invalid credentials', 401));

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(new ErrorResponse('Invalid credentials', 401));

    if (!user.isActive) {
      return next(new ErrorResponse('Your account has been deactivated. Contact your administrator.', 403));
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id).select(
    '-password -activationToken -activationExpire -resetPasswordToken -resetPasswordExpire -accessCode'
  );
  res.status(200).json({ success: true, data: user });
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  const fieldsToUpdate = {
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: user });
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(req.body.currentPassword))) {
      return next(new ErrorResponse('Password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot password — sends reset token (kept for future use)
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return next(new ErrorResponse('No user with that email', 404));

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Reset token generated',
      resetToken // In production, send via email instead
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return next(new ErrorResponse('Invalid or expired token', 400));

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Logout
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
