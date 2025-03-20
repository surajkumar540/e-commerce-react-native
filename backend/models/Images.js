// Define Image Schema & Model

const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  title: String,
  category: String,
  imageUrl: String,
  publicId: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Image", imageSchema);
