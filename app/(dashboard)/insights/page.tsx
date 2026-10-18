import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return (
    <PageHeader eyebrow="How your spending is changing" title="Insights" />
  );
}
