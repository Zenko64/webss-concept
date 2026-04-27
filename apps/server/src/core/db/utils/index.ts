import { db } from "#/core/db";
import type { Transaction } from "#/shared/types";

export async function transaction<T>(
  fn: (tx: Transaction) => Promise<T>,
): Promise<T > {
  try {
    return await db.transaction(async (tx) => {
      return await fn(tx);
    });
  } catch (error) {
    throw error;
  }
}
