require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");

const wallpaperRoutes = require("./routes/wallpapers");
const { default: mongoose } = require("mongoose");
const { imageSchema } = require("./models/images");

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// Routes
// app.use("/api/wallpapers", wallpaperRoutes);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/wallpapers", wallpaperRoutes);
app.use("/api/users", require("./routes/users"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).send("Server Error");
});

const Image = mongoose.model("Image", imageSchema);

// API Routes
app.post("/api/images", async (req, res) => {
  try {
    const { title, category, imageUrl, publicId } = req.body;
    if (!title || !category || !imageUrl || !publicId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newImage = new Image({ title, category, imageUrl, publicId });
    await newImage.save();
    res
      .status(201)
      .json({ message: "Image uploaded successfully", image: newImage });
  } catch (error) {
    console.error("Error saving image:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Express.js route for getting images with category and pagination
app.get("/api/get-images", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category || null;

    // Build query based on whether a category is specified
    const query = category && category !== "All" ? { category } : {};

    // Find images with the query and pagination
    const images = await Image.find(query).skip(skip).limit(limit);

    // Count total images that match the query
    const totalImages = await Image.countDocuments(query);

    console.log(
      `Found ${images.length} images for category: ${category || "All"}`
    );

    res.status(200).json({
      images,
      totalPages: Math.ceil(totalImages / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Optional: Endpoint to get all available categories
app.get("/api/categories", async (req, res) => {
  try {
    // Get unique categories from the database
    const categories = await Image.distinct("category");
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a single image by ID
app.get("/api/images/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }
    res.status(200).json(image);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
