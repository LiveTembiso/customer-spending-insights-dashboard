import { z } from "zod";

import { categoryNameSchema } from "@/features/categories/schemas";
import { amountSchema } from "@/lib/schemas";

// The brief lists "on_track" and "warning" and leaves the rest open;
// "exceeded" covers a budget that has been overspent.
export const goalStatusSchema = z.enum(["on_track", "warning", "exceeded"]);

export type GoalStatus = z.infer<typeof goalStatusSchema>;

export const goalSchema = z.object({
  id: z.string().regex(/^goal_\w+$/),
  category: categoryNameSchema,
  monthlyBudget: z.number().positive(),
  currentSpent: amountSchema,
  // Can pass 100 once a budget is overspent.
  percentageUsed: z.number().nonnegative(),
  daysRemaining: z.int().nonnegative(),
  status: goalStatusSchema,
});

export type Goal = z.infer<typeof goalSchema>;

// GET /api/customers/{customerId}/goals
export const goalsResponseSchema = z.object({
  goals: z.array(goalSchema),
});

export type GoalsResponse = z.infer<typeof goalsResponseSchema>;
