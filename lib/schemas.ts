import { z } from "zod";

export const isoDateSchema = z.iso.date();

export const isoDateTimeSchema = z.iso.datetime();

/** Open-ended ranges are allowed; endpoints can additionally require both dates. */
export const dateRangeQuerySchema = z
  .object({
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
  })
  .refine(
    ({ startDate, endDate }) =>
      startDate === undefined || endDate === undefined || startDate <= endDate,
    { message: "startDate must not be after endDate", path: ["endDate"] },
  );

export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected a month as YYYY-MM");

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Expected a hex colour like #FF6B6B");

export const amountSchema = z.number().nonnegative();

// Signed, since spending can drop. Null when the previous period had nothing
// to compare with.
export const percentChangeSchema = z.number().nullable();

export const currencySchema = z.literal("ZAR");

export const PERIODS = ["7d", "30d", "90d", "1y"] as const;

export const periodSchema = z.enum(PERIODS);

export type Period = z.infer<typeof periodSchema>;

export const queryIntSchema = z.coerce.number().int();
