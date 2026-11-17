import type { Content } from "@/lib/content-types";
import { profile, skills } from "./profile";
import { projects } from "./projects";

/** Konten bawaan (seed DB, cadangan kalau DB mati, build preview). */
export const defaultContent: Content = { profile, skills, projects };
