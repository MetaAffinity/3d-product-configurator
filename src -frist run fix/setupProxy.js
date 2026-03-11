module.exports = function (app) {
  app.use((req, res, next) => {
    if (req.url.endsWith('.bin')) {
      res.set('Content-Type', 'application/octet-stream');
    }
    next();
  });
};
