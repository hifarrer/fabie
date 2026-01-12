import 'dotenv/config';
import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import indexRoutes from './routes/index.js';
import dppRoutes from './routes/dpp.js';
import naftaRoutes from './routes/nafta.js';
import aiRoutes from './routes/ai.js';
import messagesRoutes from './routes/messages.js';
import sellerRoutes from './routes/seller.js';
import authRoutes from './routes/auth.js';
import ediRoutes from './routes/edi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'fabie-mvp-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    path: '/' // Ensure cookie is sent for all paths
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Make current path and user available to all views
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.user = req.session?.user || null;
  next();
});

// Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/dpp', dppRoutes);
app.use('/nafta', naftaRoutes);
app.use('/ai', aiRoutes);
app.use('/messages', messagesRoutes);
app.use('/seller', sellerRoutes);
app.use('/api/edi', ediRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Page Not Found',
    user: req.session?.user || null
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    user: req.session?.user || null
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ███████╗ █████╗ ██████╗ ██╗███████╗                    ║
║   ██╔════╝██╔══██╗██╔══██╗██║██╔════╝                    ║
║   █████╗  ███████║██████╔╝██║█████╗                      ║
║   ██╔══╝  ██╔══██║██╔══██╗██║██╔══╝                      ║
║   ██║     ██║  ██║██████╔╝██║███████╗                    ║
║   ╚═╝     ╚═╝  ╚═╝╚═════╝ ╚═╝╚══════╝                    ║
║                                                           ║
║   AI-Powered Manufacturing Marketplace                    ║
║   MVP Server running on http://localhost:${PORT}            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;

