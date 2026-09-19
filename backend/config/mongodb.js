/**
 * MongoDB connection string for Mareko backend (Atlas cluster "Prudent").
 * Set credentials in backend/.env — never commit real passwords.
 */
const DEFAULT_MONGODB_URI =
  'mongodb+srv://<db_username>:<db_password>@prudent.ng5bzzc.mongodb.net/yegara?retryWrites=true&w=majority&appName=Prudent';

const getMongoUri = () =>
  process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_MONGODB_URI;

module.exports = {
  DEFAULT_MONGODB_URI,
  getMongoUri
};
