import { classNames } from "@/lib/utils";
import type { ReactNode } from "react";

export function KahootCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={classNames("kahoot-card p-6 md:p-8", className)}>
      {children}
    </div>
  );
}
