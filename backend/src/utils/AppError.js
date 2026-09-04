export class AppError extends Error {
  constructor(status, message, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  static badRequest(fieldErrors) {
    return new AppError(400, 'Validation failed.', fieldErrors);
  }

  static unauthorized(message = 'Missing or invalid session.') {
    return new AppError(401, message);
  }

  static forbidden(message = 'You do not have access to this resource.') {
    return new AppError(403, message);
  }

  static notFound(message = 'Not found.') {
    return new AppError(404, message);
  }
}
