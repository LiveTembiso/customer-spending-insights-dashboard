import { useEffect, useState } from "react";

import { type DayKey, toDayKey } from "./dates";

const CHECK_EVERY_MS = 60_000;

/** Today in SAST, starting from `initial` and moving on at midnight. */
export function useToday(initial: DayKey): DayKey {
  const [today, setToday] = useState(initial);

  useEffect(() => {
    const check = () => setToday(toDayKey(new Date()));
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  return today;
}
