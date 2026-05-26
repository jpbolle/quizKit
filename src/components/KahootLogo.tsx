import { classNames } from "@/lib/utils";

export function KahootLogo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sz = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl md:text-7xl",
  }[size];
  return (
    <div className={classNames("inline-flex items-baseline gap-1 font-black tracking-tight", sz, className)}>
      <span className="text-kahoot-red">Q</span>
      <span className="text-kahoot-blue">u</span>
      <span className="text-kahoot-yellow">i</span>
      <span className="text-kahoot-green">z</span>
      <span className="text-white">Kit</span>
      <span className="ml-1 inline-block animate-[wiggle_0.6s_ease-in-out_infinite] text-kahoot-magenta">!</span>
    </div>
  );
}
