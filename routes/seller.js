import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dppService from '../services/dpp.js';
import aiService from '../services/ai.js';
import authService from '../services/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

const router = Router();

// Demo seller ID (in production, this would come from auth)
const DEMO_SELLER_ID = 'demo-seller-1';

// Seller dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Check if user needs onboarding
    const user = req.session?.user;
    if (user && user.role === 'seller' && !user.onboardingCompleted) {
      return res.redirect('/seller/onboarding');
    }

    const listings = await dppService.getBySellerId(DEMO_SELLER_ID);
    
    // Also get all listings for demo purposes
    const allListings = await dppService.getAll();

    // Calculate stats
    const stats = {
      totalListings: allListings.length,
      activeListings: allListings.filter(l => l.status === 'active').length,
      totalViews: allListings.reduce((sum, l) => sum + (l.views || 0), 0),
      totalInquiries: allListings.reduce((sum, l) => sum + (l.inquiries || 0), 0)
    };

    res.render('seller-dashboard', {
      title: 'Seller Dashboard • FABIE',
      listings: allListings, // Show all listings for demo
      stats,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load dashboard',
      user: req.session?.user || null
    });
  }
});

// Create listing form selector
router.get('/create', (req, res) => {
  res.render('seller-create', {
    title: 'Create Listing • FABIE',
    user: req.session?.user || null
  });
});

// Seller onboarding page
router.get('/onboarding', async (req, res) => {
  const user = req.session?.user;
  
  if (!user || user.role !== 'seller') {
    return res.redirect('/auth/login');
  }

  // If already completed onboarding, redirect to dashboard
  if (user.onboardingCompleted) {
    return res.redirect('/seller/dashboard');
  }

  res.render('seller-onboarding', {
    title: 'Welcome to FABIE • Seller Onboarding',
    user: user
  });
});

// Complete onboarding
router.post('/onboarding/complete', async (req, res) => {
  try {
    const user = req.session?.user;
    
    if (!user || user.role !== 'seller') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Update user to mark onboarding as complete
    const updatedUser = await authService.updateUser(user.id, {
      onboardingCompleted: true
    });

    // Update session
    req.session.user = updatedUser;

    res.json({ success: true });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI-powered listing page
router.get('/create/ai-powered', (req, res) => {
  res.render('seller-ai-powered', {
    title: 'AI Powered Listing • FABIE',
    user: req.session?.user || null
  });
});

// Scan sources and extract assets
router.post('/ai-powered/scan', upload.array('documents'), async (req, res) => {
  try {
    const urls = Array.isArray(req.body.urls) ? req.body.urls : 
                 req.body.urls ? [req.body.urls] : [];
    const files = req.files || [];

    // Extract assets using AI service
    const assets = await aiService.extractAssetsFromSources(urls, files);

    res.json({ 
      success: true, 
      assets 
    });
  } catch (error) {
    console.error('Error scanning sources:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to scan sources' 
    });
  }
});

// Create draft listings from identified assets
router.post('/ai-powered/create-listings', async (req, res) => {
  try {
    const { assets } = req.body;
    
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No assets provided' 
      });
    }

    const createdListings = [];
    
    for (const asset of assets) {
      // Map asset type to DPP asset type
      const assetTypeMap = {
        'product': 'finished_part',
        'equipment': 'equipment',
        'material': 'raw_material',
        'service': 'service'
      };

      const dppData = {
        assetType: assetTypeMap[asset.type] || asset.assetType || 'raw_material',
        name: asset.name || 'Unnamed Asset',
        description: asset.description || asset.specifications || '',
        sellerId: DEMO_SELLER_ID,
        seller: {
          name: 'Demo Seller',
          location: 'Ontario, Canada'
        },
        specs: {
          material: asset.material || '',
          dimensions: asset.dimensions || '',
          form: asset.form || '',
          weight: asset.weight || '',
          partNumber: asset.partNumber || asset.part_number || asset.sku || '',
          manufacturer: asset.manufacturer || '',
          specifications: asset.specifications || asset.description || '',
          compatibility: asset.compatibility || '',
          condition: asset.condition || '',
          ...asset.specs
        },
        pricing: {
          basePrice: asset.price ? parseFloat(asset.price) : 0,
          currency: asset.currency || 'CAD',
          unit: 'unit'
        },
        availability: {
          status: asset.availability || 'draft',
          quantity: asset.quantity ? parseInt(asset.quantity) : 0,
          leadTimeDays: 7,
          minimumOrder: 1
        },
        status: 'draft' // Create as draft
      };

      const newDpp = await dppService.create(dppData);
      createdListings.push(newDpp);
    }

    res.json({ 
      success: true, 
      created: createdListings.length,
      listings: createdListings 
    });
  } catch (error) {
    console.error('Error creating listings:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create listings' 
    });
  }
});

export default router;


