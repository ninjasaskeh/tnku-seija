"use client";

import { createAuthClient } from "@neon/auth/next";

/** Klien Neon Auth buat komponen client (ngomong ke /api/auth/*). */
export const authClient = createAuthClient();
