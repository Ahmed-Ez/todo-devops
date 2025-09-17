export function requireApiKey(req, res, next) {
  if (req.path === '/healthz' || req.path === '/readyz') return next();
  const key = req.header('x-api-key');
  if (!key || key !== process.env.API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}