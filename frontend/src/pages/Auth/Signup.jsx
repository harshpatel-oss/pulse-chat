// src/pages/Auth/Signup.jsx
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, AtSign } from "lucide-react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../context/UiContext";

export default function Signup() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { signup, isSubmitting } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    const result = await signup(values);
    if (result.ok) {
      toast.success("Account created! Welcome to Pulse.");
      navigate("/chat", { replace: true });
    } else {
      toast.error(result.error || "Signup failed");
    }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-1">Create your account</h1>
      <p className="text-ink-dim text-sm mb-6">Start chatting in seconds.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          icon={<User size={17} />}
          placeholder="Jordan Avery"
          error={errors.fullName?.message}
          {...register("fullName", { required: "Full name is required" })}
        />
        <Input
          label="Username"
          icon={<AtSign size={17} />}
          placeholder="jordanavery"
          error={errors.username?.message}
          {...register("username", { required: "Username is required" })}
        />
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
          placeholder="At least 6 characters"
          error={errors.password?.message}
          {...register("password", {
            required: "Password is required",
            minLength: { value: 6, message: "Password must be at least 6 characters" },
          })}
        />

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-ink-dim mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-accent font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
