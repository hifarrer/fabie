import { Router } from 'express';
import dppService from '../services/dpp.js';

const router = Router();

// Demo seller ID (in production, this would come from auth)
const DEMO_SELLER_ID = 'demo-seller-1';

// Seller dashboard
router.get('/dashboard', async (req, res) => {
  try {
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

export default router;


