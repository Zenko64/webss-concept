import type { db } from "#/core/db";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];