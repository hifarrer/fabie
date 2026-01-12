import { Router } from 'express';
import ediService from '../services/edi.js';
import dppService from '../services/dpp.js';

const router = Router();

// Get all EDI transactions for a DPP
router.get('/dpp/:dppId', async (req, res) => {
  try {
    const dpp = await dppService.getById(req.params.dppId);
    if (!dpp) {
      return res.status(404).json({ error: 'DPP not found' });
    }

    const transactions = await ediService.getByDppId(req.params.dppId);
    const workflow = await ediService.getWorkflow(req.params.dppId);

    res.json({
      dpp: {
        id: dpp.id,
        name: dpp.name,
        assetType: dpp.assetType
      },
      transactions,
      workflow
    });
  } catch (error) {
    console.error('Error fetching EDI transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single EDI transaction
router.get('/:id', async (req, res) => {
  try {
    const transaction = await ediService.getById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'EDI transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching EDI transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create EDI transaction (manual)
router.post('/', async (req, res) => {
  try {
    const validation = ediService.validateTransaction(req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const transaction = await ediService.create(req.body);
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating EDI transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate EDI 850 (Purchase Order)
router.post('/:dppId/850', async (req, res) => {
  try {
    const transaction = await ediService.generate850(
      req.params.dppId,
      req.body.buyer,
      req.body.orderDetails
    );
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error generating EDI 850:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate EDI 855 (Purchase Order Acknowledgment)
router.post('/:transactionId/855', async (req, res) => {
  try {
    const transaction = await ediService.generate855(
      req.params.transactionId,
      req.body
    );
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error generating EDI 855:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate EDI 856 (Ship Notice)
router.post('/:transactionId/856', async (req, res) => {
  try {
    const transaction = await ediService.generate856(
      req.params.transactionId,
      req.body
    );
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error generating EDI 856:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate EDI 810 (Invoice)
router.post('/:transactionId/810', async (req, res) => {
  try {
    const transaction = await ediService.generate810(
      req.params.transactionId,
      req.body
    );
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error generating EDI 810:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate EDI 820 (Payment Order)
router.post('/:transactionId/820', async (req, res) => {
  try {
    const transaction = await ediService.generate820(
      req.params.transactionId,
      req.body
    );
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error generating EDI 820:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate EDI 997 (Functional Acknowledgment)
router.post('/:transactionId/997', async (req, res) => {
  try {
    const transaction = await ediService.generate997(
      req.params.transactionId,
      req.body.status || 'accepted'
    );
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error generating EDI 997:', error);
    res.status(500).json({ error: error.message });
  }
});

// Use AI to draft EDI transaction
router.post('/:dppId/draft', async (req, res) => {
  try {
    const { transactionType, context } = req.body;
    
    if (!transactionType) {
      return res.status(400).json({ error: 'Transaction type is required' });
    }

    const transaction = await ediService.draftWithAI(
      req.params.dppId,
      transactionType,
      context || {}
    );
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error drafting EDI with AI:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update EDI transaction
router.put('/:id', async (req, res) => {
  try {
    const transaction = await ediService.update(req.params.id, req.body);
    res.json(transaction);
  } catch (error) {
    console.error('Error updating EDI transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete EDI transaction
router.delete('/:id', async (req, res) => {
  try {
    await ediService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting EDI transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get EDI workflow for a DPP
router.get('/dpp/:dppId/workflow', async (req, res) => {
  try {
    const workflow = await ediService.getWorkflow(req.params.dppId);
    res.json(workflow);
  } catch (error) {
    console.error('Error fetching EDI workflow:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
