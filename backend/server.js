const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');

// Load env vars
dotenv.config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const auth = require('./routes/auth');
const reports = require('./routes/reports');
const users = require('./routes/users');
const analytics = require('./routes/analytics');
const events = require('./routes/events');
const resources = require('./routes/resources');
const meetings = require('./routes/meetings');
const announcements = require('./routes/announcements');
const notifications = require('./routes/notifications');
const publicRoutes = require('./routes/public');
const chatbot = require('./routes/chatbot');
const services = require('./routes/services');
const departments = require('./routes/departments');
const kebeles = require('./routes/kebeles');
const auditLogs = require('./routes/auditLogs');

// Import middleware
const errorHandler = require('./middleware/error');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

const frontendOrigins = [
  ...(process.env.FRONTEND_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean),
  'https://marekospecialwereda.vercel.app',
  'http://localhost:3000'
];

const isAllowedOrigin = (origin, callback) => {
  if (!origin || frontendOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error('Origin is not allowed by CORS'));
};

const io = socketio(server, {
  cors: {
    origin: isAllowedOrigin,
    credentials: true
  }
});
app.set('io', io);

// Enable CORS
const corsOptions = {
  origin: isAllowedOrigin,
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Set security headers
// Allow the React frontend on a different origin to embed uploaded images from /uploads.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', auth);
app.use('/api/reports', reports);
app.use('/api/users', users);
app.use('/api/analytics', analytics);
app.use('/api/events', events);
app.use('/api/resources', resources);
app.use('/api/meetings', meetings);
app.use('/api/announcements', announcements);
app.use('/api/notifications', notifications);
app.use('/api/public', publicRoutes);
app.use('/api/chatbot', chatbot);
app.use('/api/services', services);
app.use('/api/departments', departments);
app.use('/api/kebeles', kebeles);
app.use('/api/audit-logs', auditLogs);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Yegara Community System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      reports: '/api/reports',
      users: '/api/users',
      analytics: '/api/analytics',
      events: '/api/events',
      resources: '/api/resources',
      meetings: '/api/meetings',
      announcements: '/api/announcements',
      notifications: '/api/notifications',
      public: '/api/public',
      chatbot: '/api/chatbot',
      services: '/api/services',
      departments: '/api/departments',
      kebeles: '/api/kebeles'
    }
  });
});

// Error handler middleware
app.use(errorHandler);

// Socket.io for real-time notifications
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(`user-${userId}`);
  });
  
  socket.on('report-updated', ({ reportId, userIds }) => {
    userIds.forEach(userId => {
      io.to(`user-${userId}`).emit('notification', {
        type: 'report_update',
        message: 'Your report status has been updated',
        reportId
      });
    });
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});