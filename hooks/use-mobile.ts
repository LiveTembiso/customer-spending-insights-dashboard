import { useMediaQuery } from "@/lib/use-media-query";

export function useIsMobile() {
  return useMediaQuery("(max-width: 767px)");
}
