import mongoose from "mongoose";

const InstitutionalSchema = new mongoose.Schema({


    members: Number,
    sharecapital: Number,
    reservefund: Number,
    deposit: Number,
    loan: Number,
    totalassets: Number,
    academicYear: String
});

const InstitutionalDetail = mongoose.model('Institutional', InstitutionalSchema);
export default InstitutionalDetail;