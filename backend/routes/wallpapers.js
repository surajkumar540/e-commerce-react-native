const express = require("express");
const router = express.Router();
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const { upload, cloudinary } = require("../config/cloudinary");
const Wallpaper = require("../models/Wallpaper");
const User = require("../models/User");

// Fetch all wallpapers
router.get("/", async (req, res) => {
  try {
    const wallpapers = await Wallpaper.find();
    res.json(wallpapers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch wallpaper by ID
router.get("/:id", async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id).populate(
      "category",
      "name"
    );
    if (!wallpaper)
      return res.status(404).json({ message: "Wallpaper not found" });

    res.json(wallpaper);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Create a new wallpaper (Admin only)
router.post(
  "/",
  [authMiddleware, adminMiddleware, upload.single("image")],
  async (req, res) => {
    try {
      const { title, description, category } = req.body;

      if (!req.file)
        return res.status(400).json({ message: "Image is required" });

      const newWallpaper = new Wallpaper({
        title,
        description,
        imageUrl: req.file.path,
        cloudinaryPublicId: req.file.filename,
        category,
      });

      const wallpaper = await newWallpaper.save();
      res.json(wallpaper);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Update a wallpaper (Admin only)
router.put(
  "/:id",
  [authMiddleware, adminMiddleware, upload.single("image")],
  async (req, res) => {
    try {
      const { title, description, category, isPublished } = req.body;
      let wallpaper = await Wallpaper.findById(req.params.id);

      if (!wallpaper)
        return res.status(404).json({ message: "Wallpaper not found" });

      wallpaper.title = title || wallpaper.title;
      wallpaper.description = description || wallpaper.description;
      if (category) wallpaper.category = category;
      if (isPublished !== undefined)
        wallpaper.isPublished = isPublished === "true" || isPublished === true;

      if (req.file) {
        await cloudinary.uploader.destroy(wallpaper.cloudinaryPublicId);
        wallpaper.imageUrl = req.file.path;
        wallpaper.cloudinaryPublicId = req.file.filename;
      }

      await wallpaper.save();
      res.json(wallpaper);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Delete a wallpaper (Admin only)
router.delete("/:id", [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id);
    if (!wallpaper)
      return res.status(404).json({ message: "Wallpaper not found" });

    await cloudinary.uploader.destroy(wallpaper.cloudinaryPublicId);
    await wallpaper.deleteOne();

    res.json({ message: "Wallpaper removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Track wallpaper download
router.post("/:id/download", async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id);
    if (!wallpaper)
      return res.status(404).json({ message: "Wallpaper not found" });

    wallpaper.downloads += 1;
    await wallpaper.save();

    res.json({ success: true, downloads: wallpaper.downloads });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Toggle like (requires auth)
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const wallpaper = await Wallpaper.findById(req.params.id);

    if (!wallpaper)
      return res.status(404).json({ message: "Wallpaper not found" });

    const isFavorite = user.favorites.includes(wallpaper._id);

    if (isFavorite) {
      user.favorites = user.favorites.filter(
        (id) => id.toString() !== wallpaper._id.toString()
      );
      wallpaper.likes -= 1;
    } else {
      user.favorites.push(wallpaper._id);
      wallpaper.likes += 1;
    }

    await user.save();
    await wallpaper.save();

    res.json({ success: true, liked: !isFavorite, likes: wallpaper.likes });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
