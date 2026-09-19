const crypto = require('crypto');

const ACTIVATION_EXPIRE_MS = 24 * 60 * 60 * 1000; // 24 hours

exports.createActivationToken = () => {
  const plainToken = crypto.randomBytes(20).toString('hex');
  const activationToken = crypto
    .createHash('sha256')
    .update(plainToken)
    .digest('hex');

  return {
    plainToken,
    activationToken,
    activationExpire: Date.now() + ACTIVATION_EXPIRE_MS
  };
};

exports.hashActivationToken = (plainToken) =>
  crypto.createHash('sha256').update(plainToken).digest('hex');

exports.buildActivationUrl = (plainToken) =>
  `${process.env.FRONTEND_URL}/activate/${plainToken}`;
