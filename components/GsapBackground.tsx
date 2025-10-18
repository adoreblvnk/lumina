"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function GsapBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".lumina-blob").forEach((el, i) => {
        const duration = 18 + i * 6;
        const x = (i % 2 === 0 ? 1 : -1) * (120 + i * 30);
        const y = (i % 3 === 0 ? -1 : 1) * (80 + i * 25);
        gsap.to(el, {
          x,
          y,
          scale: 1.15 + (i % 3) * 0.05,
          rotate: i * 15,
          filter: "blur(40px)",
          duration,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="lumina-blob absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-400/40 via-sky-300/40 to-cyan-300/40" />
      <div className="lumina-blob absolute top-1/3 -right-16 h-80 w-80 rounded-full bg-gradient-to-br from-rose-300/40 via-fuchsia-300/40 to-violet-300/40" />
      <div className="lumina-blob absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-amber-200/40 via-orange-200/40 to-pink-200/40" />
      <div className="lumina-blob absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-300/40 via-teal-300/40 to-cyan-300/40" />
    </div>
  );
}
