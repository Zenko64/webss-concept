/**
 * @name AppContext
 * @description These types are used by the Hono server
 * to define the context (Context is the type of the C parameter along with its Methods)
 * and env, (Env is the type of c.env which stores variables for each user request)
 * the context
 * @module types/hono
 * @author Zenko
 * @version 1.0.0
 */
import type { Context } from "hono";
import type { AuthType } from "../libs/auth";

export type AppEnv = {
  Variables: AuthType;
};

// The AppContext
export type AppContext = Context<AppEnv>;
