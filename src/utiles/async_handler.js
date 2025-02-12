import { apiError } from "./api_errors.js";

const asyncHandlerPromises = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => next(error));
  };
};

const asyncHandlerAsync = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      res
        .status(error.code || 500)
        .json(
          apiError(error.code || 500, error.message || "Internal Server Error")
        );
    }
  };
};

export { asyncHandlerPromises, asyncHandlerAsync };
