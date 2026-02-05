'use client';

import { LoginCard } from "@/components/auth/LoginCard";
import { useEffect, useState } from "react";


export default function Home() {
  // Use the server-side API route to handle the redirect securely
  const loginUrl = '/api/auth/login';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate particles data only on client
  const particles = mounted ? [...Array(20)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: `${5 + Math.random() * 10}s`,
    delay: `${Math.random() * 5}s`,
  })) : [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Mesh */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

        {/* Floating Particles - Client-side only */}
        {mounted && (
          <div className="absolute inset-0" suppressHydrationWarning>
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute w-1 h-1 bg-white rounded-full opacity-30"
                style={{
                  left: particle.left,
                  top: particle.top,
                  animation: `float ${particle.duration} linear infinite`,
                  animationDelay: particle.delay,
                }}
              ></div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo/Title Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 shadow-2xl shadow-purple-500/50 animate-pulse-slow">
              <span className="text-4xl font-bold text-white">P</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              PlanOS
            </h1>
            <p className="text-purple-200 text-sm">
              Digital Transformation Platform
            </p>
          </div>

          {/* Login Card */}
          <LoginCard loginUrl={loginUrl} />

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-purple-300/60">
            © {new Date().getFullYear()} PlanOS. All rights reserved.
          </p>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes float {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-100vh) translateX(50px);
            opacity: 0;
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
