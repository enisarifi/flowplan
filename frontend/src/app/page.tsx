"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  BarChart3,
  RefreshCw,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Zap,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      router.replace("/dashboard");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Nav */}
      <header className="bg-[rgb(var(--surface))]/80 backdrop-blur-xl border-b border-[rgb(var(--border-subtle))] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-brand-sm">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-display font-bold text-brand-600 dark:text-brand-400">FlowPlan</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm font-medium text-surface-700 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 px-4 py-2 rounded-lg transition-colors">
              Log in
            </Link>
            <Link href="/register" className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-brand-sm hover:shadow-brand-md">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 bg-grid opacity-30 dark:opacity-15" />

        {/* Gradient orbs — liquid blur */}
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-brand-400/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-accent-400/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-300/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: "6s" }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-8 border border-brand-200 dark:border-brand-800 shadow-soft animate-fade-up">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Study Planning
          </div>

          {/* Heading */}
          <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-up stagger-1">
            <span className="text-gradient">Study smarter,</span>
            <br />
            <span className="text-[rgb(var(--foreground))]">not harder.</span>
          </h1>

          <p className="text-lg md:text-xl text-surface-600 dark:text-surface-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-up stagger-2">
            FlowPlan uses AI to build a personalized weekly study schedule around your subjects, energy peaks, and exam dates — then continuously adapts it based on how your sessions actually go.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up stagger-3">
            <Link href="/register" className="group inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-4 rounded-xl text-sm transition-all shadow-brand-md hover:shadow-glow btn-shimmer animate-shimmer">
              Create free account
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border-strong))] text-[rgb(var(--foreground))] hover:border-brand-300 dark:hover:border-brand-700 font-semibold px-8 py-4 rounded-xl text-sm transition-all shadow-soft hover:shadow-medium">
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[rgb(var(--foreground))] mb-3">How FlowPlan works</h2>
          <p className="text-surface-600 dark:text-surface-400 text-lg">Three steps to smarter studying</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Brain className="w-6 h-6" />}
            step="01"
            title="AI-generated schedule"
            description="Tell FlowPlan your subjects, difficulty levels, and exam dates. It builds a realistic weekly plan that respects your study hours and energy peak."
            delay="stagger-1"
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6" />}
            step="02"
            title="Session feedback loop"
            description="After each study session, log your energy level, difficulty rating, and how much you completed. FlowPlan tracks your real patterns."
            delay="stagger-2"
          />
          <FeatureCard
            icon={<RefreshCw className="w-6 h-6" />}
            step="03"
            title="Continuous adaptation"
            description="One click re-adapts your entire schedule based on your feedback — putting hard subjects at your peak energy time and prioritising upcoming exams."
            delay="stagger-3"
          />
        </div>
      </section>

      {/* Journey steps */}
      <section className="relative bg-[rgb(var(--surface))] border-y border-[rgb(var(--border-subtle))] py-24 overflow-hidden bg-grain">
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[rgb(var(--foreground))] mb-3">Your journey</h2>
            <p className="text-surface-600 dark:text-surface-400 text-lg">From zero to optimized in minutes</p>
          </div>
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Connector line (desktop) */}
            <div className="hidden lg:block absolute top-[38px] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 dark:from-brand-800 dark:via-brand-600 dark:to-brand-800" />

            <StepCard icon={<Zap className="w-5 h-5" />} step="1" title="Set preferences" desc="Study hours, energy peak, session length" delay="stagger-1" />
            <StepCard icon={<Calendar className="w-5 h-5" />} step="2" title="Add subjects" desc="Difficulty, weekly hours, exam dates" delay="stagger-2" />
            <StepCard icon={<Brain className="w-5 h-5" />} step="3" title="Generate schedule" desc="AI creates your personalized week" delay="stagger-3" />
            <StepCard icon={<CheckCircle2 className="w-5 h-5" />} step="4" title="Study & adapt" desc="Complete sessions, AI learns & adjusts" delay="stagger-4" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-liquid" />
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Ready to study smarter?</h2>
          <p className="text-brand-200 text-lg mb-10 max-w-lg mx-auto">Join FlowPlan and let AI optimize your study schedule.</p>
          <Link href="/register" className="group inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-4 rounded-xl text-sm transition-all shadow-heavy hover:shadow-glow-lg hover:scale-[1.02]">
            Get started for free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgb(var(--border-subtle))] py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-display font-semibold text-surface-500">FlowPlan</span>
          </div>
          <p className="text-xs text-surface-500">AI-Powered Study Planning</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  step,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div className={`group relative glass glow-border rounded-2xl p-7 hover:shadow-medium transition-all hover:-translate-y-1 animate-fade-up ${delay}`}>
      {/* Step number — large, background */}
      <span className="absolute top-4 right-5 text-5xl font-display font-extrabold text-surface-100 dark:text-surface-950 select-none">{step}</span>

      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-xl flex items-center justify-center mb-5 shadow-brand-sm group-hover:shadow-brand-md transition-shadow">
          {icon}
        </div>
        <h3 className="font-display font-bold text-[rgb(var(--foreground))] mb-2 text-lg">{title}</h3>
        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StepCard({
  icon,
  step,
  title,
  desc,
  delay,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  desc: string;
  delay: string;
}) {
  return (
    <div className={`relative text-center animate-fade-up ${delay}`}>
      <div className="relative z-10 w-[76px] h-[76px] bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brand-md">
        {icon}
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-accent-400 text-brand-950 rounded-full text-xs font-bold flex items-center justify-center shadow-soft">{step}</span>
      </div>
      <h3 className="font-display font-bold text-[rgb(var(--foreground))] text-sm mb-1">{title}</h3>
      <p className="text-xs text-surface-600 dark:text-surface-400">{desc}</p>
    </div>
  );
}
