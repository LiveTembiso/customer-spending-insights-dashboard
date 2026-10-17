import { connection } from "next/server";

import { getCustomerTransactions } from "@/features/transactions/server/store";
import { NO_STORE_HEADERS } from "@/lib/api/route";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

// Readiness: the data source can serve the default customer.
export async function GET() {
  await connection();
  const headers = NO_STORE_HEADERS;

  try {
    const records = getCustomerTransactions(
      env.NEXT_PUBLIC_DEFAULT_CUSTOMER_ID,
      new Date(),
    );
    if (!records) throw new Error("Default customer has no data");
    return Response.json({ status: "ready" }, { headers });
  } catch (error) {
    logger.error({ err: error, route: "/api/ready" }, "readiness check failed");
    return Response.json({ status: "not_ready" }, { status: 503, headers });
  }
}
