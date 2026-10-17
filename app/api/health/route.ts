import { connection } from "next/server";

import { NO_STORE_HEADERS } from "@/lib/api/route";

// Liveness: the process is up and serving requests.
export async function GET() {
  await connection();
  return Response.json(
    { status: "ok", uptimeSeconds: Math.round(process.uptime()) },
    { headers: NO_STORE_HEADERS },
  );
}
