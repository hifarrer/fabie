import { Router } from 'express';
import messageService from '../services/messages.js';
import dppService from '../services/dpp.js';

const router = Router();

// Demo user ID (in production, this would come from auth)
const DEMO_USER_ID = 'demo-buyer-1';

// Inbox view
router.get('/', async (req, res) => {
  try {
    const threads = await messageService.getThreads(DEMO_USER_ID);

    res.render('messaging', {
      title: 'Messages • FABIE',
      threads,
      activeThread: null,
      currentUserId: DEMO_USER_ID,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error loading messages:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load messages',
      user: req.session?.user || null
    });
  }
});

// View thread
router.get('/thread/:threadId', async (req, res) => {
  try {
    const threads = await messageService.getThreads(DEMO_USER_ID);
    const activeThread = await messageService.getThread(req.params.threadId);

    if (!activeThread) {
      return res.redirect('/messages');
    }

    // Mark messages as read
    await messageService.markAsRead(req.params.threadId, DEMO_USER_ID);

    res.render('messaging', {
      title: 'Messages • FABIE',
      threads,
      activeThread,
      currentUserId: DEMO_USER_ID,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error loading thread:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load conversation',
      user: req.session?.user || null
    });
  }
});

// Send message in thread
router.post('/thread/:threadId', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.redirect(`/messages/thread/${req.params.threadId}`);
    }

    await messageService.sendMessage(req.params.threadId, DEMO_USER_ID, content.trim());
    res.redirect(`/messages/thread/${req.params.threadId}`);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to send message',
      user: req.session?.user || null
    });
  }
});

// Start new conversation (from DPP page)
router.post('/start', async (req, res) => {
  try {
    const { dppId, message } = req.body;

    if (!dppId || !message || !message.trim()) {
      return res.redirect(`/dpp/${dppId}`);
    }

    const { thread } = await messageService.startConversation(DEMO_USER_ID, dppId, message.trim());
    res.redirect(`/messages/thread/${thread.id}`);
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to start conversation',
      user: req.session?.user || null
    });
  }
});

// Contact seller page (for DPP)
router.get('/contact/:dppId', async (req, res) => {
  try {
    const dpp = await dppService.getById(req.params.dppId);

    if (!dpp) {
      return res.status(404).render('404', { 
        title: 'DPP Not Found',
        user: req.session?.user || null
      });
    }

    res.render('contact-seller', {
      title: `Contact Seller • ${dpp.name}`,
      dpp,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error loading contact page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load contact page',
      user: req.session?.user || null
    });
  }
});

export default router;


