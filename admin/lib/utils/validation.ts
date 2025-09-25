import { ZodError } from "zod";
import { jsonError } from "./http";

export function handleZodError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError(422, "validation_error", error.issues.map((issue) => issue.message).join("; "));
  }
  throw error;
}
