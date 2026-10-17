import "server-only";

import type { ProfileResponse } from "../schemas";

export type Customer = Pick<
  ProfileResponse,
  "customerId" | "name" | "email" | "joinDate" | "accountType"
>;

const CUSTOMERS: readonly Customer[] = [
  {
    customerId: "12345",
    name: "Lerato Mokoena",
    email: "lerato.mokoena@example.com",
    joinDate: "2023-01-15",
    accountType: "premium",
  },
];

export function findCustomer(customerId: string): Customer | undefined {
  return CUSTOMERS.find((customer) => customer.customerId === customerId);
}
