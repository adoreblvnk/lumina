"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Orb } from "@/components/ui/orb";

export default function LuminaLanding() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from(".ll-hero-title", { y: 24, opacity: 0, duration: 0.7, ease: "power3.out" });
      gsap.from([".ll-hero-sub", ".ll-hero-cta"], { y: 16, opacity: 0, duration: 0.5, stagger: 0.1, delay: 0.2 });

      gsap.utils.toArray<HTMLElement>(".ll-reveal").forEach((el) => {
        gsap.from(el, {
          y: 24,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="w-full">
      <section className="relative flex flex-col items-center text-center pt-28 pb-20">
        <div className="max-w-3xl px-6">
          <h1 className="ll-hero-title text-6xl font-black tracking-tight">Lumina</h1>
          <p className="ll-hero-sub mt-4 text-lg opacity-80">AI Discussion Facilitator for small‑group learning</p>
          <div className="ll-hero-cta mt-8 flex items-center justify-center gap-4">
            <a href="#discussion"><Button size="xl">Start discussion</Button></a>
            <Link href="/teacher/dashboard"><Button size="xl" variant="outline">Teacher dashboard</Button></Link>
          </div>
          <div className="mt-10 flex justify-center">
            <Orb className="w-64 h-64" agentState={"thinking"} />
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard title="Real‑time analysis" body="Groq-powered transcription, topic tracking, and conversational health metrics." />
          <FeatureCard title="Supportive interventions" body="Gentle nudges on click and auto voice guidance via ElevenLabs when needed." />
          <FeatureCard title="Teacher oversight" body="Live alerts for severe cases so teachers can help the right group fast." />
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="ll-reveal space-y-4">
            <h2 className="text-3xl font-bold">How it works</h2>
            <ol className="space-y-3 text-base opacity-90 list-decimal list-inside">
              <li>Students onboard with quick voice registration.</li>
              <li>Audio streams to Lumina for live transcription and analysis.</li>
              <li>Mild nudges appear; severe cases trigger spoken guidance + teacher alert.</li>
            </ol>
          </div>
          <div className="ll-reveal">
            <div className="rounded-2xl border bg-white/70 backdrop-blur p-6 shadow-sm">
              <p className="text-sm opacity-80">Designed for Breadth and Depth modes to match your prompt goals.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Badge>Groq</Badge>
                <Badge>ElevenLabs</Badge>
                <Badge>Vercel AI SDK</Badge>
                <Badge>Next.js</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="ll-reveal rounded-2xl border bg-white/70 backdrop-blur p-6 shadow-sm">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm opacity-80">{body}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium bg-white/60">
      {children}
    </span>
  );
}
