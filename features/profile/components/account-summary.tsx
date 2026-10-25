import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import { initials } from "../initials";
import { getCurrentProfile } from "../server/current";

const capitalise = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export async function AccountSummary() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  return (
    <div className="flex items-center gap-3 text-white">
      <Avatar
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e6ecf3] text-sm font-bold text-navy"
      >
        <AvatarFallback className="bg-transparent font-bold text-inherit">
          {initials(profile.name)}
        </AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-bold">{profile.name}</span>
        <span className="text-xs text-sidebar-foreground">
          {capitalise(profile.accountType)} account
        </span>
      </span>
    </div>
  );
}

export async function AccountAvatar() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  return (
    <Avatar className="flex size-11 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
      <AvatarFallback
        aria-hidden
        className="bg-transparent font-bold text-inherit"
      >
        {initials(profile.name)}
      </AvatarFallback>
      <span className="sr-only">Signed in as {profile.name}</span>
    </Avatar>
  );
}

export function AccountSummarySkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 rounded-full bg-sidebar-accent" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-28 bg-sidebar-accent" />
        <Skeleton className="h-3 w-20 bg-sidebar-accent" />
      </div>
    </div>
  );
}

export function AccountAvatarSkeleton() {
  return <Skeleton className="size-11 rounded-full" />;
}
