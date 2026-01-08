import { Router } from 'express';
import naftaService from '../services/nafta.js';
import dppService from '../services/dpp.js';

const router = Router();

// View NAFTA breakdown for a DPP
router.get('/:dppId', async (req, res) => {
  try {
    const dpp = await dppService.getById(req.params.dppId);
    
    if (!dpp) {
      return res.status(404).render('404', { 
        title: 'DPP Not Found',
        user: req.session?.user || null
      });
    }

    const inputs = await naftaService.getInputsByDppId(dpp.id);

    res.render('nafta', {
      title: `NAFTA/CUSMA • ${dpp.name}`,
      dpp,
      inputs,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error loading NAFTA page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load NAFTA data',
      user: req.session?.user || null
    });
  }
});

// Enable NAFTA tracking
router.post('/:dppId/enable', async (req, res) => {
  try {
    await naftaService.enableNAFTATracking(req.params.dppId);
    res.redirect(`/nafta/${req.params.dppId}`);
  } catch (error) {
    console.error('Error enabling NAFTA:', error);
    res.status(500).json({ error: 'Failed to enable NAFTA tracking' });
  }
});

// Add NAFTA input
router.post('/:dppId/inputs', async (req, res) => {
  try {
    const inputData = {
      name: req.body.name,
      category: req.body.category,
      country: req.body.country,
      cost: req.body.cost
    };

    await naftaService.addInput(req.params.dppId, inputData);
    res.redirect(`/nafta/${req.params.dppId}`);
  } catch (error) {
    console.error('Error adding input:', error);
    res.status(500).json({ error: 'Failed to add input' });
  }
});

// Update NAFTA input
router.post('/inputs/:inputId', async (req, res) => {
  try {
    const updates = {
      name: req.body.name,
      category: req.body.category,
      country: req.body.country,
      cost: req.body.cost
    };

    const input = await naftaService.updateInput(req.params.inputId, updates);
    res.redirect(`/nafta/${input.dppId}`);
  } catch (error) {
    console.error('Error updating input:', error);
    res.status(500).json({ error: 'Failed to update input' });
  }
});

// Delete NAFTA input
router.post('/inputs/:inputId/delete', async (req, res) => {
  try {
    // Get input first to know the dppId for redirect
    const inputs = await naftaService.getInputsByDppId(req.body.dppId);
    await naftaService.deleteInput(req.params.inputId);
    res.redirect(`/nafta/${req.body.dppId}`);
  } catch (error) {
    console.error('Error deleting input:', error);
    res.status(500).json({ error: 'Failed to delete input' });
  }
});

// Recalculate RVC
router.post('/:dppId/calculate', async (req, res) => {
  try {
    const result = await naftaService.calculateRVC(req.params.dppId);
    res.redirect(`/nafta/${req.params.dppId}`);
  } catch (error) {
    console.error('Error calculating RVC:', error);
    res.status(500).json({ error: 'Failed to calculate RVC' });
  }
});

// Generate certificate (mock)
router.get('/:dppId/certificate', async (req, res) => {
  try {
    const certificate = await naftaService.generateCertificate(req.params.dppId);
    const dpp = await dppService.getById(req.params.dppId);

    res.render('nafta-certificate', {
      title: 'Certificate of Origin',
      certificate,
      dpp,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: error.message || 'Failed to generate certificate',
      user: req.session?.user || null
    });
  }
});

export default router;


