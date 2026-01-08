import { Router } from 'express';
import aiService from '../services/ai.js';

const router = Router();

// AI recommendation page
router.get('/recommend', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      // Show default recommendation demo (Scenario #11)
      const defaultQuery = '321 stainless steel high temperature exhaust 1500F';
      const recommendation = await aiService.getRecommendation(defaultQuery);
      
      return res.render('ai-recommendation', {
        title: 'AI Recommendation • FABIE',
        query: defaultQuery,
        recommendation,
        tcoFormatted: aiService.formatTCOComparison(recommendation.tcoAnalysis),
        isDemo: true,
        user: req.session?.user || null
      });
    }

    const recommendation = await aiService.getRecommendation(q);

    res.render('ai-recommendation', {
      title: 'AI Recommendation • FABIE',
      query: q,
      recommendation,
      tcoFormatted: aiService.formatTCOComparison(recommendation.tcoAnalysis),
      isDemo: false,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error getting recommendation:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to generate recommendation',
      user: req.session?.user || null
    });
  }
});

// API endpoint for AJAX recommendations
router.get('/api/recommend', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const recommendation = await aiService.getRecommendation(q);
    recommendation.tcoFormatted = aiService.formatTCOComparison(recommendation.tcoAnalysis);

    res.json(recommendation);
  } catch (error) {
    console.error('Error in API recommendation:', error);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
});

export default router;


