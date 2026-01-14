// Simple password protection middleware for development
export const passwordAuth = (req, res, next) => {
  // Check if user has already authenticated
  if (req.session?.devAuthenticated) {
    return next();
  }

  // Show login form for unauthenticated requests
  return res.render('dev-login', {
    title: 'Development Access',
    error: null,
    layout: false,
    redirect: req.originalUrl
  });
};
