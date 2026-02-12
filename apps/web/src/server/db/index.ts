import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./auth-schema";
import { env } from "@/env.ts";

export const db = drizzle(neon(env.DATABASE_URL!), { schema });