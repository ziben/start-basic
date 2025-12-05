import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "~/lib/auth";

// https://tanstack.com/start/latest/docs/framework/react/middleware
// This is a sample middleware that you can use in your server functions.

/**
 * Middleware to get user session and add to context.
 * Does NOT block unauthenticated requests - let route guards handle that.
 */
export const authMiddleware = createMiddleware().server(async ({ next }: any) => {
  const { headers } = getRequest()!;

  const session = await auth.api.getSession({
    headers,
    query: {
      // ensure session is fresh
      // https://www.better-auth.com/docs/concepts/session-management#session-caching
      disableCookieCache: true,
    },
  });

  // 不抛错，让路由层处理认证逻辑
  return next({ context: { user: session?.user ?? null } });
});
