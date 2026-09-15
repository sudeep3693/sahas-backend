import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;
const DBConnect = (req, res, next) => {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return next();
  }

  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('Database connected successfully');
      next();
    })
    .catch((err) => {
      console.error('Error while connecting to database:', err);
      next();
    });
};

export default DBConnect;
