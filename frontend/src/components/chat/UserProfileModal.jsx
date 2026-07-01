import { useEffect, useState } from "react";
import { Mail, AtSign, Clock } from "lucide-react";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import { Skeleton } from "../ui/Skeleton";
import userService from "../../services/userService";
import { formatLastSeen } from "../../utils/formatTime";
import { toast } from "../../context/UiContext";

export default function UserProfileModal({
  open,
  onClose,
  userId,
  fallbackUser,
}) {
  const [profile, setProfile] = useState(fallbackUser ?? null);
  const [loading, setLoading] = useState(false);
  
  // 🔥 FIX: prevent background scroll (this fixes "upward jump/overflow feeling")
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  useEffect(() => {
    if (!open || !userId) return;

    setLoading(true);
    userService
      .getUserById(userId)
      .then((data) => setProfile(data.user))
      .catch((error) => {
        toast.error(error.message || "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, [open, userId]);

  return (
    <Modal open={open} onClose={onClose} title="Profile" className="max-w-sm">
      {/* 🔥 FIX: constrain modal content height */}
      <div className="max-h-[80vh] overflow-y-auto px-1">
        {loading && !profile ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : profile ? (
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <Avatar
              src={profile.profilePic}
              name={profile.fullName}
              id={profile._id}
              size={80}
            />

            <div>
              <p className="font-display font-semibold text-lg">
                {profile.fullName}
              </p>
              {profile.status && (
                <p className="text-sm text-ink-dim mt-0.5">
                  {profile.status}
                </p>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm text-ink-dim border-t border-border pt-3 w-full">
                {profile.bio}
              </p>
            )}

            <div className="w-full space-y-2 border-t border-border pt-3 text-left">
              {profile.username && (
                <div className="flex items-center gap-2.5 text-sm">
                  <AtSign size={15} className="text-ink-dim shrink-0" />
                  <span>{profile.username}</span>
                </div>
              )}

              {profile.email && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail size={15} className="text-ink-dim shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 text-sm">
                <Clock size={15} className="text-ink-dim shrink-0" />
                <span>{formatLastSeen(profile.lastSeen)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-dim text-center py-4">
            Couldn't load this profile.
          </p>
        )}
      </div>
    </Modal>
  );
}