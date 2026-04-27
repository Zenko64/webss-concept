import { AppError } from "../errors";
import type { AppContext } from "../types/global";

export function checkAuth(c: AppContext) {
  if (!c.var.user || !c.var.user.id) {
    throw new AppError("Unauthorized.", 401);
  }
  return { userId: c.var.user.id };
}
