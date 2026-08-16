const validate = (schema) => (req, res, next) => {
  try {
    // Validate request body, query params, and route params
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return next(result.error);
    }

    // Replace request parameters with parsed, sanitized data
    req.body = result.data.body || req.body;
    req.query = result.data.query || req.query;
    req.params = result.data.params || req.params;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validate;
