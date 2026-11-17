"use client";

import { createAuthClient } from "better-auth/react";

/** Klien Better Auth buat komponen client (ngomong ke /api/auth/*, domain yang sama). */
export const authClient = createAuthClient();
