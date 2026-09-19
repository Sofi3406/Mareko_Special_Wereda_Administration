const mongoose = require('mongoose');
const { getMongoUri } = require('./mongodb');

const connectDB = async () => {
  const uri = getMongoUri();

  if (!uri || uri.includes('<db_username>') || uri.includes('<db_password>')) {
    console.error(
      '❌ Error: Set MONGODB_URI in backend/.env with your Atlas username and password (see backend/.env.example).'
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;