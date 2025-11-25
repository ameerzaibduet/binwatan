"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { pageview } from "@/lib/fpixel";

export default function PixelProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  useEffect(() => {
    pageview();
  }, [path]);

  return <>{children}</>;
}
