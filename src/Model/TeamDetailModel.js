import mongoose from 'mongoose';

const teamDetailSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  category: { type: String, required: true },
  imageName: { type: String, required: true }
}, {
  timestamps: true
});

const TeamDetail = mongoose.model('TeamDetail', teamDetailSchema);
export default TeamDetail;
