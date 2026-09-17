const CorsMiddleware = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
};

export default CorsMiddleware;