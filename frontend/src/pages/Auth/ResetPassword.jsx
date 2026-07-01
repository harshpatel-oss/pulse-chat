// src/pages/Auth/ResetPassword.jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, AlertTriangle } from "lucide-react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import authService from "../../services/authService";
import { toast } from "../../context/UiContext";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-warn/15 flex items-center justify-center mx-auto mb-4 text-warn">
          <AlertTriangle size={26} />
        </div>
        <h1 className="font-display font-bold text-xl mb-2">Missing reset token</h1>
        <p className="text-sm text-ink-dim mb-6">
          This link is missing or invalid. Please request a new password reset.
        </p>
        <Link to="/forgot-password" className="text-accent font-medium hover:underline text-sm">
          Request new link
        </Link>
      </div>
    );
  }

  const onSubmit = async ({ password }) => {
    setSubmitting(true);
    try {
      await authService.resetPassword(token, password);
      toast.success("Password reset. Please log in.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error.message || "Reset failed — the link may have expired");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-1">Set a new password</h1>
      <p className="text-ink-dim text-sm mb-6">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New password"
          type="password"
          icon={<Lock size={17} />}
          placeholder="At least 6 characters"
          error={errors.password?.message}
          {...register("password", {
            required: "Password is required",
            minLength: { value: 6, message: "Password must be at least 6 characters" },
          })}
        />
        <Input
          label="Confirm new password"
          type="password"
          icon={<Lock size={17} />}
          placeholder="Repeat your password"
          error={errors.confirm?.message}
          {...register("confirm", {
            required: "Please confirm your password",
            validate: (v) => v === watch("password") || "Passwords do not match",
          })}
        />
        <Button type="submit" className="w-full" size="lg" isLoading={submitting}>
          Reset password
        </Button>
      </form>
    </div>
  );
}
