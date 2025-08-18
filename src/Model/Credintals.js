// Model/Credintals.js
import mongoose from 'mongoose';

const CredintalSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  otp_secret: {
    type: String,
    required: false,
  },
  otp_expiry: {
    type: Date,
    required: false,
  },
});

const Credintal = mongoose.model('Credintal', CredintalSchema);
export default Credintal;
