import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z, type ZodError } from "zod";

export class ValidationError extends Error {
  public readonly errors: z.core.$ZodFlattenedError<unknown>;
  constructor(message: string, zodError: ZodError) {
    super(message);
    this.name = "ValidationError";
    this.stack = zodError.stack;
    this.errors = z.flattenError(zodError);
  }
}

export class AppError extends Error {
  public readonly status: ContentfulStatusCode;
  constructor(message: string, status: ContentfulStatusCode) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}
