import {
  CircleAlert,
  CircleCheck,
  type LucideIcon,
  TriangleAlert,
} from "lucide-react";

import type { GoalStatus } from "./schemas";

export const GOAL_STATUS: Record<
  GoalStatus,
  {
    label: string;
    icon: LucideIcon;
    pill: string;
    bar: string;
    track: string;
  }
> = {
  on_track: {
    label: "On track",
    icon: CircleCheck,
    pill: "bg-success-surface text-success-foreground",
    bar: "bg-success",
    track: "bg-background",
  },
  warning: {
    label: "Warning",
    icon: TriangleAlert,
    pill: "bg-warning-track text-warning-foreground",
    bar: "bg-warning",
    track: "bg-warning-track",
  },
  exceeded: {
    label: "Over budget",
    icon: CircleAlert,
    pill: "bg-warning-track text-warning-foreground",
    bar: "bg-warning",
    track: "bg-warning-track",
  },
};
