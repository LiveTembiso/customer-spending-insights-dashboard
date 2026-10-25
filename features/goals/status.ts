import {
  CircleAlert,
  CircleCheck,
  type LucideIcon,
  TriangleAlert,
} from "lucide-react";

import type { GoalStatus } from "./schemas";

const WARNING_DETAIL = {
  box: "border-warning-border bg-warning-surface",
  title: "text-warning-foreground",
  text: "text-warning-muted",
  track: "bg-warning-track",
};

export const GOAL_STATUS: Record<
  GoalStatus,
  {
    label: string;
    icon: LucideIcon;
    pill: string;
    bar: string;
    track: string;
    detail: { box: string; title: string; text: string; track: string };
  }
> = {
  on_track: {
    label: "On track",
    icon: CircleCheck,
    pill: "bg-success-surface text-success-foreground",
    bar: "bg-success",
    track: "bg-background",
    detail: {
      box: "border-transparent bg-success-surface",
      title: "text-success-foreground",
      text: "text-success-foreground",
      track: "bg-card",
    },
  },
  warning: {
    label: "Warning",
    icon: TriangleAlert,
    pill: "bg-warning-track text-warning-foreground",
    bar: "bg-warning",
    track: "bg-warning-track",
    detail: WARNING_DETAIL,
  },
  exceeded: {
    label: "Over budget",
    icon: CircleAlert,
    pill: "bg-warning-track text-warning-foreground",
    bar: "bg-warning",
    track: "bg-warning-track",
    detail: WARNING_DETAIL,
  },
};
