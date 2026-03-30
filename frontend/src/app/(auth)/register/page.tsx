"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@/hooks/useAuth";
import { GraduationCap, UserPlus, Sparkles } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  email: z.string().email(),
  display_name: z.string().min(2),
  password: z.string().min(6),
});
type FormData = z.infer<typeof schema>;

const inputClass = "w-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface))] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 text-[rgb(var(--foreground))] placeholder:text-surface-400 transition-all";

export default function RegisterPage() {
  const router = useRouter();
  const register_ = useRegister();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await register_.mutateAsync(data);
      router.push("/onboarding");
    } catch {
      // error displayed via register_.error below
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Decorative panel */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-brand-400/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-20 right-20 w-56 h-56 bg-accent-400/15 rounded-full blur-[60px]" />
        <div className="relative text-center px-12">
          <Sparkles className="w-12 h-12 text-brand-200 mx-auto mb-6" />
          <h2 className="font-display text-3xl font-bold text-white mb-4">Join thousands<br />of students.</h2>
          <p className="text-brand-200 text-sm leading-relaxed max-w-sm mx-auto">Create your account and let AI build your perfect study schedule in minutes.</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-brand-50/40 to-transparent dark:from-brand-950/20 dark:to-transparent" />
        <div className="relative w-full max-w-md animate-fade-up">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-brand-sm">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-display font-bold text-brand-600 dark:text-brand-400">FlowPlan</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-[rgb(var(--foreground))] mb-2">Create your account</h1>
          <p className="text-surface-500 mb-8 text-sm">Start studying smarter with FlowPlan</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">Name</label>
              <input {...register("display_name")} className={inputClass} placeholder="Your name" />
              {errors.display_name && <p className="text-red-500 text-xs mt-1.5">{errors.display_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">Email</label>
              <input {...register("email")} type="email" className={inputClass} placeholder="you@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">Password</label>
              <input {...register("password")} type="password" className={inputClass} placeholder="Min. 6 characters" />
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
            </div>
            {register_.error && <p className="text-red-500 text-sm">Registration failed. Email may already be in use.</p>}
            <button
              type="submit"
              disabled={register_.isPending}
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-60 shadow-brand-sm hover:shadow-brand-md mt-2"
            >
              <UserPlus className="w-4 h-4" />
              {register_.isPending ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="text-sm text-surface-500 mt-8 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-500 hover:text-brand-600 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
