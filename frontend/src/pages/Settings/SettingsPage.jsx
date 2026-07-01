// src/pages/Settings/SettingsPage.jsx
//
// FIXES (item 3 + item 7):
//
// 1. react-hook-form's `defaultValues` are captured ONCE at first render.
//    AuthContext resolves the cold-load /auth/refresh asynchronously, so on
//    first paint `user` is frequently still null — RHF would freeze the
//    profile form at empty strings forever, even after the real user data
//    arrives a moment later. This is very likely why "Edit Profile" looked
//    broken: the fields appeared blank/stale instead of showing the actual
//    profile. Fixed with a `useEffect` that calls `profileForm.reset(...)`
//    whenever `user` changes, so the form re-syncs once data is available.
//
// 2. changePassword's request body only needs { currentPassword,
//    newPassword } per auth.controller.js — confirmed correct here. But
//    that controller has NO try/catch around its body (every sibling
//    function in the same file does). If bcrypt or the DB throws, Express
//    has nothing to catch it, and the request can hang instead of cleanly
//    erroring. This is a backend bug outside the frontend's reach — flagged
//    here and in the project README. The frontend now also validates the
//    new password length client-side before sending, so at minimum a
//    request that would obviously fail validation never goes out.
//
// 3. updateProfile only applies `bio`/`status` when truthy
//    (`if (bio) user.bio = bio`), which means CLEARING a field by saving an
//    empty string silently does nothing server-side — the old value stays.
//    This is a backend limitation (not something the frontend can route
//    around), so the success toast now says "Profile updated" without
//    implying empty fields were cleared, and is noted in the README.
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Camera, Lock, Shield, LogOut, Monitor, Sun, Moon } from "lucide-react";
import Avatar from "../../components/ui/Avatar";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import authService from "../../services/authService";
import userService from "../../services/userService";
import { fileToBase64, validateImageFile } from "../../utils/fileToBase64";
import { toast } from "../../context/UiContext";
import { cn } from "../../utils/misc";

function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-accent">{icon}</span>
        <h3 className="font-display font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUserLocal, logoutAllDevices } = useAuth();
  const { theme, setTheme } = useTheme();

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [privacyPref, setPrivacyPref] = useState(user?.settings?.privacy ?? "private");

  const profileForm = useForm({
    defaultValues: { fullName: "", username: "", bio: "", status: "" },
  });
  const passwordForm = useForm();

  // FIX: re-sync the form whenever the real user object becomes available
  // or changes (e.g. after the cold-load refresh resolves, or after saving).
  // Without this, the form can stay frozen on empty defaultValues — see
  // the file-level note above.
  useEffect(() => {
    if (!user) return;
    profileForm.reset({
      fullName: user.fullName || "",
      username: user.username || "",
      bio: user.bio || "",
      status: user.status || "",
    });
    setPrivacyPref(user.settings?.privacy ?? "private");
  }, [user, profileForm]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { valid, error } = validateImageFile(file);
    if (!valid) return toast.error(error);
    const base64 = await fileToBase64(file);
    setAvatarPreview(URL.createObjectURL(file));
    setSavingProfile(true);
    try {
      const data = await authService.updateProfile({ profilePic: base64 });
      updateUserLocal(data.user);
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(error.message || "Failed to update photo");
    } finally {
      setSavingProfile(false);
    }
  };

  const onProfileSubmit = async (values) => {
    setSavingProfile(true);
    try {
      const data = await authService.updateProfile(values);
      updateUserLocal(data.user);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (values) => {
    setSavingPassword(true);
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      toast.success("Password changed successfully");
      passwordForm.reset();
    } catch (error) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePrivacyChange = async (value) => {
    setPrivacyPref(value);
    setSavingPrivacy(true);
    try {
      const data = await userService.updateSettings({ privacy: value });
      updateUserLocal(data.user);
    } catch (error) {
      toast.error(error.message || "Failed to update privacy setting");
      setPrivacyPref(user?.settings?.privacy ?? "private"); // revert on failure
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm("This will log you out on every device. Continue?")) return;
    await logoutAllDevices();
    toast.success("Logged out from all devices");
  };

  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="max-w-2xl mx-auto px-4 md:px-0 py-6 space-y-5">
        <h1 className="font-display font-bold text-2xl mb-1">Settings</h1>

        <SectionCard title="Profile" icon={<Camera size={16} />}>
          <div className="flex items-center gap-4 mb-5">
            <label className="relative cursor-pointer">
              <Avatar
                src={avatarPreview || user?.profilePic}
                name={user?.fullName}
                id={user?._id}
                size={72}
              />
              <div className="absolute -bottom-1 -right-1 bg-accent text-white rounded-full p-1.5">
                <Camera size={12} />
              </div>
              <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </label>
            <div>
              <p className="font-medium">{user?.fullName}</p>
              <p className="text-sm text-ink-dim">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full name" {...profileForm.register("fullName")} />
              <Input label="Username" {...profileForm.register("username")} />
            </div>
            <Input label="Status" {...profileForm.register("status")} />
            <div>
              <label className="block text-sm font-medium text-ink-dim mb-1.5">Bio</label>
              <textarea
                {...profileForm.register("bio")}
                rows={3}
                className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/20 resize-none"
              />
            </div>
            <Button type="submit" isLoading={savingProfile}>
              Save changes
            </Button>
          </form>
        </SectionCard>

        <SectionCard title="Change password" icon={<Lock size={16} />}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3">
            <Input
              label="Current password"
              type="password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register("currentPassword", {
                required: "Current password is required",
              })}
            />
            <Input
              label="New password"
              type="password"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register("newPassword", {
                required: "New password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
            />
            <Button type="submit" isLoading={savingPassword}>
              Update password
            </Button>
          </form>
        </SectionCard>

        <SectionCard title="Appearance" icon={<Monitor size={16} />}>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-colors",
                theme === "light" ? "border-accent bg-accent/5" : "border-border"
              )}
            >
              <Sun size={20} />
              <span className="text-sm font-medium">Light</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-colors",
                theme === "dark" ? "border-accent bg-accent/5" : "border-border"
              )}
            >
              <Moon size={20} />
              <span className="text-sm font-medium">Dark</span>
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Privacy" icon={<Shield size={16} />}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Profile visibility</p>
              <p className="text-xs text-ink-dim">Who can see your profile details</p>
            </div>
            <select
              value={privacyPref}
              disabled={savingPrivacy}
              onChange={(e) => handlePrivacyChange(e.target.value)}
              className="bg-elevated border border-border rounded-lg px-3 py-1.5 text-sm outline-none disabled:opacity-60"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </SectionCard>

        <SectionCard title="Security" icon={<Shield size={16} />}>
          <p className="text-sm text-ink-dim mb-3">
            Log out of all other sessions, including other browsers and devices.
          </p>
          <Button variant="danger" onClick={handleLogoutAll}>
            <LogOut size={15} /> Log out of all devices
          </Button>
        </SectionCard>
      </div>
    </div>
  );
}
