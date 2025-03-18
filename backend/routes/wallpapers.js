// backend/routes/wallpapers.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { upload, cloudinary } = require('../config/cloudinary');
const Wallpaper = require('../models/Wallpaper');
const User = require('../models/User');

// Get all wallpapers (public, paginated)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const query = { isPublished: true };
    if (category) {
      query.category = category;
    }
    
    const wallpapers = await Wallpaper.find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('category', 'name');
    
    const count = await Wallpaper.countDocuments(query);
    
    res.json({
      wallpapers,
      totalPages: Math.ceil(count / limit),
      currentPage: page * 1,
      totalCount: count
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get wallpaper by ID
router.get('/:id', async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id).populate('category', 'name');
    
    if (!wallpaper) {
      return res.status(404).json({ message: 'Wallpaper not found' });
    }
    
    res.json(wallpaper);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Wallpaper not found' });
    }
    res.status(500).send('Server error');
  }
});

// Admin routes - protected
// Create a wallpaper
router.post('/', [authMiddleware, adminMiddleware, upload.single('image')], async (req, res) => {
  try {
    const { title, description, category } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }
    
    const newWallpaper = new Wallpaper({
      title,
      description,
      imageUrl: req.file.path,
      cloudinaryPublicId: req.file.filename,
      category
    });
    
    const wallpaper = await newWallpaper.save();
    res.json(wallpaper);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a wallpaper
router.put('/:id', [authMiddleware, adminMiddleware, upload.single('image')], async (req, res) => {
  try {
    const { title, description, category, isPublished } = req.body;
    
    let wallpaper = await Wallpaper.findById(req.params.id);
    if (!wallpaper) {
      return res.status(404).json({ message: 'Wallpaper not found' });
    }
    
    wallpaper.title = title || wallpaper.title;
    wallpaper.description = description || wallpaper.description;
    if (category) wallpaper.category = category;
    if (isPublished !== undefined) {
      wallpaper.isPublished = isPublished === 'true' || isPublished === true;
    }
    
    wallpaper.updatedAt = Date.now();
    
    if (req.file) {
      // Delete old image
      await cloudinary.uploader.destroy(wallpaper.cloudinaryPublicId);
      
      wallpaper.imageUrl = req.file.path;
      wallpaper.cloudinaryPublicId = req.file.filename;
    }
    
    await wallpaper.save();
    res.json(wallpaper);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a wallpaper
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id);
    
    if (!wallpaper) {
      return res.status(404).json({ message: 'Wallpaper not found' });
    }
    
    // Delete from cloudinary
    await cloudinary.uploader.destroy(wallpaper.cloudinaryPublicId);
    
    await wallpaper.deleteOne();
    
    res.json({ message: 'Wallpaper removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Track download
router.post('/:id/download', async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id);
    
    if (!wallpaper) {
      return res.status(404).json({ message: 'Wallpaper not found' });
    }
    
    wallpaper.downloads += 1;
    await wallpaper.save();
    
    res.json({ success: true, downloads: wallpaper.downloads });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Toggle like (requires auth)
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const wallpaper = await Wallpaper.findById(req.params.id);
    
    if (!wallpaper) {
      return res.status(404).json({ message: 'Wallpaper not found' });
    }
    
    // Check if already in favorites
    const isFavorite = user.favorites.includes(wallpaper._id);
    
    if (isFavorite) {
      // Remove from favorites
      user.favorites = user.favorites.filter(id => id.toString() !== wallpaper._id.toString());
      wallpaper.likes -= 1;
    } else {
      // Add to favorites
      user.favorites.push(wallpaper._id);
      wallpaper.likes += 1;
    }
    
    await user.save();
    await wallpaper.save();
    
    res.json({ 
      success: true, 
      liked: !isFavorite, 
      likes: wallpaper.likes 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;