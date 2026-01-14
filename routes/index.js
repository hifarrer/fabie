import { Router } from 'express';
import dppService from '../services/dpp.js';
import { passwordAuth } from '../middleware/passwordAuth.js';

const router = Router();

// Landing page - password protected
router.get('/', passwordAuth, async (req, res) => {
  try {
    const featuredListings = await dppService.getFeatured(3);
    
    res.render('index', {
      title: 'FABIE • AI-Powered Manufacturing Marketplace',
      featuredListings,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error loading landing page:', error);
    res.render('index', {
      title: 'FABIE • AI-Powered Manufacturing Marketplace',
      featuredListings: [],
      user: req.session?.user || null
    });
  }
});

// Marketplace browse
router.get('/marketplace', async (req, res) => {
  try {
    const { q, type, location, naftaContent, verification, ip, compliance } = req.query;
    
    // Handle array query parameters (can be single value or array)
    const intellectualProperty = ip ? (Array.isArray(ip) ? ip : [ip]) : [];
    const shopCompliance = compliance ? (Array.isArray(compliance) ? compliance : [compliance]) : [];
    
    const filters = {
      search: q,
      assetType: type,
      location,
      naftaContent: naftaContent ? parseInt(naftaContent, 10) : undefined,
      verification,
      intellectualProperty,
      shopCompliance
    };

    const dpps = await dppService.getAll(filters);

    res.render('marketplace', {
      title: 'Marketplace • FABIE',
      dpps,
      query: q || '',
      filters: {
        type: type || 'all',
        location: location || 'all',
        naftaContent: naftaContent ? parseInt(naftaContent, 10) : 0,
        verification: verification || 'any',
        intellectualProperty: intellectualProperty,
        shopCompliance: shopCompliance
      },
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error loading marketplace:', error);
    res.render('marketplace', {
      title: 'Marketplace • FABIE',
      dpps: [],
      query: '',
      filters: {},
      error: 'Failed to load listings',
      user: req.session?.user || null
    });
  }
});

export default router;


