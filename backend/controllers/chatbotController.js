const ErrorResponse = require('../utils/errorResponse');
const {
  askResidentChatbot,
  UNAVAILABLE_RESPONSE
} = require('../services/chatbotService');

// @desc    Ask resident chatbot
// @route   POST /api/chatbot/ask
// @access  Private (Resident)
exports.askChatbot = async (req, res, next) => {
  try {
    const { question } = req.body;

    if (!question || !String(question).trim()) {
      return next(new ErrorResponse('Please provide a question', 400));
    }

    const result = await askResidentChatbot({
      question,
      residentName: req.user?.fullName
    });

    return res.status(200).json({
      success: true,
      data: {
        question: String(question).trim(),
        answer: result.answer,
        source: result.source
      }
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      data: {
        question: String(req.body?.question || '').trim(),
        answer: UNAVAILABLE_RESPONSE,
        source: 'unavailable'
      }
    });
  }
};
