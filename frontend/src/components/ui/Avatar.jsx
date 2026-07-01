// src/components/ui/Avatar.jsx
import { cn, getInitials, colorFromId } from "../../utils/misc";

export default function Avatar({
  src,
  name = "",
  id = "",
  size = 44,
  online = false,
  showRing = false,
  className,
}) {
  const dim = `${size}px`;
  const initials = getInitials(name);
  const bg = colorFromId(id || name);

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: dim, height: dim }}>
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-display font-semibold text-white select-none"
        style={{ backgroundColor: src ? undefined : bg, fontSize: size * 0.38 }}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          initials
        )}
      </div>
      {showRing && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-surface",
            online ? "bg-success" : "bg-ink-dim/50"
          )}
          style={{
            width: Math.max(10, size * 0.28),
            height: Math.max(10, size * 0.28),
          }}
        >
          {online && (
            <span className="absolute inset-0 rounded-full bg-success animate-pulse-ring" />
          )}
        </span>
      )}
    </div>
  );
}
