// Wraps an async route handler so rejected promises hit the error middleware.
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
