import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  category: { type: String, enum: ["reports", "downloads"], required: true },
  filePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const Document = mongoose.model("Document", documentSchema);

export default Document;
