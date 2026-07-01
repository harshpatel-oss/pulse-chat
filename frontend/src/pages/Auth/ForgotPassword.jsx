// src/pages/Auth/ForgotPassword.jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Mail, CheckCircle2 } from "lucide-react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import authService from "../../services/authService";
import { toast } from "../../context/UiContext";

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async ({ email }) => {
    setSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-success/15 flex items-center justify-center mx-auto mb-4 text-success">
          <CheckCircle2 size={26} />
        </div>
        <h1 className="font-display font-bold text-xl mb-2">Check your inbox</h1>
        <p className="text-sm text-ink-dim mb-6">
          If an account exists for that email, we've sent a link to reset your password.
        </p>
        <Link to="/login" className="text-accent font-medium hover:underline text-sm">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-1">Reset your password</h1>
      <p className="text-ink-dim text-sm mb-6">
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          icon={<Mail size={17} />}
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email", {
            required: "Email is required",
            pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" },
          })}
        />
        <Button type="submit" className="w-full" size="lg" isLoading={submitting}>
          Send reset link
        </Button>
      </form>

      <p className="text-center text-sm text-ink-dim mt-6">
        <Link to="/login" className="text-accent font-medium hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
