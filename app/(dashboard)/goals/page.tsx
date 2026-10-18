import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Goals" };

export default function GoalsPage() {
  return <PageHeader eyebrow="This month's budgets" title="Spending goals" />;
}
