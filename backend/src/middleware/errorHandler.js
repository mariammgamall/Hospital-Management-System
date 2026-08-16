class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log critical server issues
  if (err.statusCode === 500) {
    console.error('SERVER EXCEPTION 💥:', err);
  }

  // Handle Prisma Known Errors (Unique constraints, etc.)
  if (err.code === 'P2002') {
    const fields = err.meta ? err.meta.target : [];
    return res.status(400).json({
      success: false,
      message: `Duplicate value entered for fields: ${fields.join(', ')}`,
      errors: {
        fields: `${fields.join(', ')} must be unique`
      }
    });
  }

  // Handle Prisma Record Not Found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: err.meta?.cause || 'Record not found in database.'
    });
  }

  // Handle Custom Zod Validation Errors
  if (err.name === 'ZodError') {
    const formattedErrors = {};
    err.errors.forEach((e) => {
      formattedErrors[e.path.join('.')] = e.message;
    });
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: formattedErrors
    });
  }

  // Default Express response
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    errors: err.errors || null,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = {
  AppError,
  errorHandler
};
