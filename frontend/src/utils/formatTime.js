// src/utils/formatTime.js
import {
  format,
  isToday,
  isYesterday,
  formatDistanceToNowStrict,
  isThisYear,
} from "date-fns";

export const formatMessageTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return format(d, "h:mm a");
};

export const formatChatListTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  if (isThisYear(d)) return format(d, "MMM d");
  return format(d, "MM/dd/yy");
};

export const formatLastSeen = (date) => {
  if (!date) return "Offline";
  const d = new Date(date);
  if (isToday(d)) return `last seen today at ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `last seen yesterday at ${format(d, "h:mm a")}`;
  return `last seen ${formatDistanceToNowStrict(d, { addSuffix: true })}`;
};

export const formatDayDivider = (date) => {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
};

export const isSameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};
