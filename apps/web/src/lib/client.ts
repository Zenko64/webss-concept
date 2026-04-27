import { hc } from "hono/client";
import type { AppType } from "../../../server/main";

// TODO: Add a error toast
export async function assertOk(res: Response) {
  if (res.ok) return;
  if (res.headers.get("content-type")?.includes("application/json")) {
    const { error } = (await res.json()) as { error: string };
    throw new Error(error ?? `HTTP ${res.status}`);
  }
  throw new Error(`HTTP ${res.status}`);
}

const client = hc<AppType>("/");
export default client;
