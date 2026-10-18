import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { QuietBoundary } from "@/components/layout/quiet-boundary";
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
        <QuietBoundary>
          <Suspense fallback={<AccountSummarySkeleton />}>
            <AccountSummary />
          </Suspense>
        </QuietBoundary>
      }
      accountCompact={
        <QuietBoundary>
          <Suspense fallback={<AccountAvatarSkeleton />}>
            <AccountAvatar />
          </Suspense>
        </QuietBoundary>
      }
      badges={{
        "/goals": (
          <QuietBoundary>
            <Suspense>
              <GoalsAttentionBadge />
            </Suspense>
          </QuietBoundary>
        ),
      }}
    >
      {children}
    </AppShell>
  );
}
