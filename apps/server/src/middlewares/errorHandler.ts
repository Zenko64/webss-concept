// TODO: Switch all from console.log to pino
import { AppError, ValidationError } from "#/shared/errors";
import { createMiddleware } from "hono/factory";

const errorHandler = createMiddleware(async (c, next) => {
  try {
    await next();
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(
        {
          error: error.message,
        },
        error.status,
      );
    } else if (error instanceof ValidationError) {
      return c.json(
        {
          error: error.errors,
        },
        400,
      );
    }
    console.error("Internal error:", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unknown internal error has occurred.",
      },
      500,
    );
  }
});
