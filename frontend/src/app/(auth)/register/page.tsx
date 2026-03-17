"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email(),
  display_name: z.string().min(2),
  password: z.string().min(6),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const register_ = useRegister();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await register_.mutateAsync(data);
    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Create your account</h1>
        <p className="text-slate-500 mb-6 text-sm">Start studying smarter with FlowPlan</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              {...register("display_name")}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Your name"
            />
            {errors.display_name && <p className="text-red-500 text-xs mt-1">{errors.display_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              {...register("password")}
              type="password"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          {register_.error && <p className="text-red-500 text-sm">Registration failed. Email may already be in use.</p>}
          <button
            type="submit"
            disabled={register_.isPending}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-60"
          >
            {register_.isPending ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-4 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-brand-500 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
