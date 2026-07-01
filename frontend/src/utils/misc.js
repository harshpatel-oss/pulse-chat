// src/utils/misc.js

export const cn = (...classes) => classes.filter(Boolean).join(" ");

export const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Deterministic color from a string, used for avatar fallback backgrounds.
const AVATAR_PALETTE = [
  "#5B8CFF",
  "#34D399",
  "#F2B84B",
  "#F26B6B",
  "#A78BFA",
  "#22D3EE",
  "#FB923C",
  "#E879F9",
];

export const colorFromId = (id = "") => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

export const truncate = (str = "", max = 40) =>
  str.length > max ? `${str.slice(0, max).trimEnd()}…` : str;
