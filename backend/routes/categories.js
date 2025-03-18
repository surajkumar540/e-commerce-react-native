
// backend/routes/categories.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const Category = require('../models/Category');
const Wallpaper = require('../models/Wallpaper');

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Admin routes - protected
// Create a category
router.post('/', [authMiddleware, adminMiddleware, upload.single('thumbnail')], async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    const newCategory = new Category({
      name,
      description,
      thumbnailUrl: req.file ? req.file.path : ''
    });
    
    const category = await newCategory.save();
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a category
router.put('/:id', [authMiddleware, adminMiddleware, upload.single('thumbnail')], async (req, res) => {
  try {
    const { name, description } = req.body;
    
    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    category.name = name || category.name;
    category.description = description || category.description;
    
    if (req.file) {
      category.thumbnailUrl = req.file.path;
    }
    
    await category.save();
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a category
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    // Check if category has wallpapers
    const wallpaperCount = await Wallpaper.countDocuments({ category: req.params.id });
    if (wallpaperCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category with wallpapers' });
    }
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    await category.deleteOne();
    res.json({ message: 'Category removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
