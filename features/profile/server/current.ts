import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { env } from "@/lib/env";

import { getProfile } from "./repository";

/** The signed-in customer's profile, read once per request. */
export const getCurrentProfile = cache(async () => {
  await connection();
  return getProfile(env.NEXT_PUBLIC_DEFAULT_CUSTOMER_ID, new Date());
});
