import { Badge } from "@/components/ui/badge";
import { getCurrentGoals } from "../server/current";

/** Count of goals that need attention, for the Goals nav item. */
export async function GoalsAttentionBadge() {
  const response = await getCurrentGoals();
  const count =
    response?.goals.filter((goal) => goal.status !== "on_track").length ?? 0;
  if (count === 0) return null;

  return (
    <Badge className="inline-flex min-w-5 items-center justify-center rounded-full bg-attention px-1.5 text-xs leading-5 font-extrabold text-navy">
      <span aria-hidden>{count}</span>
      <span className="sr-only">
        , {count} {count === 1 ? "goal needs" : "goals need"} attention
      </span>
    </Badge>
  );
}
