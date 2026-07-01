// src/pages/Auth/Login.jsx
import { useForm } from "react-hook-form";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../context/UiContext";

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { login, isSubmitting } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onSubmit = async (values) => {
    const result = await login(values);
    if (result.ok) {
      toast.success("Welcome back!");
      navigate(location.state?.from?.pathname || "/chat", { replace: true });
    } else {
      toast.error(result.error || "Login failed");
    }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-1">Welcome back</h1>
      <p className="text-ink-dim text-sm mb-6">Log in to continue your conversations.</p>

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
        <Input
          label="Password"
          type="password"
          icon={<Lock size={17} />}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password", { required: "Password is required" })}
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-accent hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Log in
        </Button>
      </form>

      <p className="text-center text-sm text-ink-dim mt-6">
        Don't have an account?{" "}
        <Link to="/signup" className="text-accent font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
