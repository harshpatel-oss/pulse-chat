// src/components/ui/Skeleton.jsx
import { cn } from "../../utils/misc";

export function Skeleton({ className }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function SidebarItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-11 h-11 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function MessageSkeleton({ align = "left" }) {
  return (
    <div className={cn("flex", align === "right" ? "justify-end" : "justify-start")}>
      <Skeleton className={cn("h-10 rounded-2xl", align === "right" ? "w-40" : "w-56")} />
    </div>
  );
}
