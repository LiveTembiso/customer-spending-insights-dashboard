"use client";

import { catchError } from "next/error";

function Fallback() {
  return null;
}

export const QuietBoundary = catchError(Fallback);
