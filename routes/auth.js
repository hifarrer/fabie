import { Router } from 'express';
import authService from '../services/auth.js';

const router = Router();

// Login page
router.get('/login', (req, res) => {
  if (req.session?.user) {
    return res.redirect('/');
  }
  
  res.render('auth/login', {
    title: 'Login • FABIE',
    error: req.query.error || null,
    success: req.query.success || null
  });
});

// Login handler
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.redirect('/auth/login?error=Please enter email and password');
    }

    const user = await authService.login(email, password);
    
    // Set session
    req.session.user = user;
    
    // Redirect based on role
    if (user.role === 'seller') {
      // Check if seller needs onboarding
      if (!user.onboardingCompleted) {
        res.redirect('/seller/onboarding');
      } else {
        res.redirect('/seller/dashboard');
      }
    } else {
      res.redirect('/marketplace');
    }
  } catch (error) {
    res.redirect('/auth/login?error=' + encodeURIComponent(error.message));
  }
});

// Register page
router.get('/register', (req, res) => {
  if (req.session?.user) {
    return res.redirect('/');
  }

  res.render('auth/register', {
    title: 'Register • FABIE',
    role: req.query.role || null,
    error: req.query.error || null
  });
});

// Register handler
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, company, location, phone, role } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.redirect('/auth/register?error=Please fill in all required fields&role=' + role);
    }

    if (password !== confirmPassword) {
      return res.redirect('/auth/register?error=Passwords do not match&role=' + role);
    }

    if (password.length < 6) {
      return res.redirect('/auth/register?error=Password must be at least 6 characters&role=' + role);
    }

    if (!['buyer', 'seller'].includes(role)) {
      return res.redirect('/auth/register?error=Invalid role selected');
    }

    const user = await authService.register({
      name,
      email,
      password,
      company,
      location,
      phone,
      role
    });

    // Auto-login after registration
    req.session.user = user;

    // Redirect based on role
    if (role === 'seller') {
      // Redirect new sellers to onboarding
      res.redirect('/seller/onboarding');
    } else {
      res.redirect('/marketplace');
    }
  } catch (error) {
    const role = req.body.role || '';
    res.redirect('/auth/register?error=' + encodeURIComponent(error.message) + '&role=' + role);
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.redirect('/');
  });
});

// Profile page
router.get('/profile', (req, res) => {
  if (!req.session?.user) {
    return res.redirect('/auth/login');
  }

  res.render('auth/profile', {
    title: 'My Profile • FABIE',
    error: req.query.error || null,
    success: req.query.success || null
  });
});

// Update profile
router.post('/profile', async (req, res) => {
  if (!req.session?.user) {
    return res.redirect('/auth/login');
  }

  try {
    const { name, company, location, phone } = req.body;

    const updatedUser = await authService.updateUser(req.session.user.id, {
      name,
      company,
      location,
      phone
    });

    req.session.user = updatedUser;
    res.redirect('/auth/profile?success=Profile updated successfully');
  } catch (error) {
    res.redirect('/auth/profile?error=' + encodeURIComponent(error.message));
  }
});

export default router;


