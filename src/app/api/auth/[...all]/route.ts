import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/** Endpoint Better Auth (/api/auth/*): mulai login Google, callback OAuth, sesi, sign out. */
export const { GET, POST } = toNextJsHandler(auth);
