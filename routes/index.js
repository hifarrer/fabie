import { Router } from 'express';
import dppService from '../services/dpp.js';

const router = Router();

// Landing page
router.get('/', async (req, res) => {
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
    const { q, type, location, nafta, verification } = req.query;
    
    const filters = {
      search: q,
      assetType: type,
      location,
      nafta,
      verification
    };

    const dpps = await dppService.getAll(filters);

    res.render('marketplace', {
      title: 'Marketplace • FABIE',
      dpps,
      query: q || '',
      filters: {
        type: type || 'all',
        location: location || 'all',
        nafta: nafta || 'any',
        verification: verification || 'any'
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


