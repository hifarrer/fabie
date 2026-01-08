import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dppService from '../services/dpp.js';
import naftaService from '../services/nafta.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

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

// View single DPP
router.get('/:id', async (req, res) => {
  try {
    const dpp = await dppService.getById(req.params.id);
    
    if (!dpp) {
      return res.status(404).render('404', { 
        title: 'DPP Not Found',
        user: req.session?.user || null
      });
    }

    // Get NAFTA inputs if enabled
    let naftaInputs = [];
    if (dpp.nafta?.enabled) {
      naftaInputs = await naftaService.getInputsByDppId(dpp.id);
    }

    res.render('dpp/detail', {
      title: `${dpp.name} • FABIE`,
      dpp,
      naftaInputs,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error loading DPP:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Failed to load listing',
      user: req.session?.user || null
    });
  }
});

// Create DPP form
router.get('/new/:assetType', async (req, res) => {
  const assetType = req.params.assetType;
  const validTypes = ['raw_material', 'finished_part', 'equipment', 'service'];
  
  if (!validTypes.includes(assetType)) {
    return res.redirect('/dpp/new/raw_material');
  }

  res.render('dpp/form', {
    title: 'Create New Listing • FABIE',
    dpp: null,
    assetType,
    isEdit: false,
    user: req.session?.user || null
  });
});

// Create DPP
router.post('/', async (req, res) => {
  try {
    const dppData = {
      assetType: req.body.assetType,
      name: req.body.name,
      description: req.body.description,
      sellerId: req.body.sellerId || 'demo-seller-1', // In MVP, use demo seller
      seller: {
        name: req.body.sellerName || 'Demo Seller',
        location: req.body.sellerLocation || 'Ontario, Canada'
      },
      specs: {
        material: req.body.material,
        dimensions: req.body.dimensions,
        weight: req.body.weight,
        form: req.body.form,
        hsCode: req.body.hsCode,
        // Equipment-specific
        make: req.body.make,
        model: req.body.model,
        year: req.body.year,
        hours: req.body.hours,
        // Service-specific
        capabilities: req.body.capabilities,
        capacity: req.body.capacity
      },
      pricing: {
        basePrice: parseFloat(req.body.price) || 0,
        currency: req.body.currency || 'CAD',
        unit: req.body.priceUnit || 'unit'
      },
      availability: {
        status: req.body.availabilityStatus || 'in_stock',
        quantity: parseInt(req.body.quantity) || 0,
        leadTimeDays: parseInt(req.body.leadTime) || 7,
        minimumOrder: parseInt(req.body.minimumOrder) || 1
      },
      status: req.body.status || 'active'
    };

    const newDpp = await dppService.create(dppData);
    res.redirect(`/dpp/${newDpp.id}`);
  } catch (error) {
    console.error('Error creating DPP:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to create listing',
      user: req.session?.user || null
    });
  }
});

// Edit DPP form
router.get('/:id/edit', async (req, res) => {
  try {
    const dpp = await dppService.getById(req.params.id);
    
    if (!dpp) {
      return res.status(404).render('404', { 
        title: 'DPP Not Found',
        user: req.session?.user || null
      });
    }

    res.render('dpp/form', {
      title: `Edit ${dpp.name} • FABIE`,
      dpp,
      assetType: dpp.assetType,
      isEdit: true,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error loading edit form:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load edit form',
      user: req.session?.user || null
    });
  }
});

// Update DPP
router.post('/:id', async (req, res) => {
  try {
    const updates = {
      name: req.body.name,
      description: req.body.description,
      specs: {
        material: req.body.material,
        dimensions: req.body.dimensions,
        weight: req.body.weight,
        form: req.body.form,
        hsCode: req.body.hsCode,
        make: req.body.make,
        model: req.body.model,
        year: req.body.year,
        hours: req.body.hours,
        capabilities: req.body.capabilities,
        capacity: req.body.capacity
      },
      pricing: {
        basePrice: parseFloat(req.body.price) || 0,
        currency: req.body.currency || 'CAD',
        unit: req.body.priceUnit || 'unit'
      },
      availability: {
        status: req.body.availabilityStatus || 'in_stock',
        quantity: parseInt(req.body.quantity) || 0,
        leadTimeDays: parseInt(req.body.leadTime) || 7,
        minimumOrder: parseInt(req.body.minimumOrder) || 1
      },
      status: req.body.status || 'active'
    };

    await dppService.update(req.params.id, updates);
    res.redirect(`/dpp/${req.params.id}`);
  } catch (error) {
    console.error('Error updating DPP:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to update listing',
      user: req.session?.user || null
    });
  }
});

// Delete DPP
router.post('/:id/delete', async (req, res) => {
  try {
    await dppService.delete(req.params.id);
    res.redirect('/seller/dashboard');
  } catch (error) {
    console.error('Error deleting DPP:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to delete listing',
      user: req.session?.user || null
    });
  }
});

// Upload document
router.post('/:id/documents', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const document = {
      name: req.body.documentName || req.file.originalname,
      type: req.body.documentType || 'other',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    };

    await dppService.addDocument(req.params.id, document);
    res.redirect(`/dpp/${req.params.id}`);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to upload document',
      user: req.session?.user || null
    });
  }
});

export default router;


