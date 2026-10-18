import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { GoalsAttentionBadge } from "@/features/goals/components/goals-attention-badge";
import {
  AccountAvatar,
  AccountAvatarSkeleton,
  AccountSummary,
  AccountSummarySkeleton,
} from "@/features/profile/components/account-summary";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell
      account={
        <Suspense fallback={<AccountSummarySkeleton />}>
          <AccountSummary />
        </Suspense>
      }
      accountCompact={
        <Suspense fallback={<AccountAvatarSkeleton />}>
          <AccountAvatar />
        </Suspense>
      }
      badges={{
        "/goals": (
          <Suspense>
            <GoalsAttentionBadge />
          </Suspense>
        ),
      }}
    >
      {children}
    </AppShell>
  );
}
