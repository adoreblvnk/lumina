"use client";

import { Button } from "@/components/ui/button";
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Orb } from "@/components/ui/orb";
import { DiscussionView } from "./DiscussionView";
import Link from "next/link";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const WelcomeScreen = ({ onGetStarted }: { onGetStarted: () => void }) => {
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
            <Button size="xl" onClick={onGetStarted}>Start discussion</Button>
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


const StudentCountScreen = ({ onNext }: { onNext: (count: number) => void }) => {
  const [studentCount, setStudentCount] = useState(4);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    
    gsap.from(containerRef.current.querySelectorAll('.anim-in'), {
      opacity: 0,
      y: 20,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out"
    });
  }, { scope: containerRef });

  const increment = () => {
    gsap.to(`#student-count`, {
      scale: 1.2,
      y: -5,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: "power1.inOut"
    });
    setStudentCount(prev => prev + 1);
  };

  const decrement = () => {
    if (studentCount > 1) {
      gsap.to(`#student-count`, {
        scale: 1.2,
        y: -5,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut"
      });
      setStudentCount(prev => (prev > 1 ? prev - 1 : 1));
    }
  };

  const handleNext = () => {
    gsap.to(containerRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.4,
      onComplete: () => onNext(studentCount)
    });
  };

  return (
    <div ref={containerRef} className="text-center space-y-8">
      <div className="space-y-2 anim-in">
        <h2 className="text-3xl font-bold text-slate-800">How many students are in your group?</h2>
        <p className="text-slate-600">Adjust the number of participants</p>
      </div>
      
      <div className="flex items-center justify-center gap-6 my-6 anim-in">
        <Button 
          onClick={decrement} 
          className="w-14 h-14 text-2xl rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800"
          disabled={studentCount <= 1}
        >
          -
        </Button>
        
        <div className="w-32">
          <div id="student-count" className="text-5xl font-bold text-slate-800">
            {studentCount}
          </div>
        </div>
        
        <Button 
          onClick={increment} 
          className="w-14 h-14 text-2xl rounded-full bg-black hover:bg-gray-800 text-white"
        >
          +
        </Button>
      </div>
      
      <div className="anim-in">
        <Button 
          onClick={handleNext}
          className="mt-4 px-8 py-6 text-lg font-semibold bg-black hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
        >
          <span className="text-white">Continue to Voice Registration</span>
        </Button>
      </div>
    </div>
  );
};

const VoiceRegistrationScreen = ({ studentCount, onComplete }: { studentCount: number, onComplete: (names: string[]) => void }) => {
  const [registeredStudents, setRegisteredStudents] = useState<string[]>([]);
  const [currentRegistering, setCurrentRegistering] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleRecordAndTranscribe = async () => {
    if (isRecording) return; // Already recording

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        try {
          const response = await fetch('/api/transcribe-name', {
            method: 'POST',
            body: audioBlob,
          });

          if (!response.ok) throw new Error('Transcription failed');
          
          const result = await response.json();
          const transcribedName = result.name;

          if (transcribedName) {
            setRegisteredStudents(prev => [...prev, transcribedName]);
            setCurrentRegistering(prev => prev + 1);
          } else {
            alert("Could not understand the name. Please try again.");
          }
        } catch (error) {
          console.error(error);
          alert("An error occurred during transcription. Please try again.");
        } finally {
          setIsTranscribing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 2500); // Record for 2.5 seconds
    } catch (error) {
      console.error("Microphone access denied:", error);
      alert("Microphone access is required for voice registration.");
    }
  };

  useEffect(() => {
    if (currentRegistering >= studentCount) {
      onComplete(registeredStudents);
    }
  }, [currentRegistering, studentCount, onComplete, registeredStudents]);

  let buttonText = "Press & Say Your Name";
  if (isRecording) buttonText = "Listening...";
  if (isTranscribing) buttonText = "Analyzing...";

  return (
    <div className="text-center max-w-sm mx-auto">
      <h2 className="text-2xl font-bold">Voice Registration</h2>
      <p className="mt-2">Student {currentRegistering + 1} of {studentCount}</p>
      
      <div className="mt-6 flex flex-col items-center gap-4">
        <Button onClick={handleRecordAndTranscribe} disabled={isRecording || isTranscribing} className="w-full h-12 text-lg">
          {buttonText}
        </Button>
      </div>

      <div className="mt-6 text-left">
        <h3 className="font-bold">Registered Students:</h3>
        <ul className="list-disc list-inside">
          {registeredStudents.map((name, index) => (
            <li key={index}>{name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const TopicIntroductionScreen = ({ studentCount, onStart }: { studentCount: number, onStart: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  
  useGSAP(() => {
    if (!containerRef.current) return;
    
    const tl = gsap.timeline();

    tl.from(containerRef.current.querySelectorAll('.anim-in'), {
      opacity: 0,
      y: 20,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out"
    });
    
    tl.fromTo(".topic-card", 
      { scale: 0.9, opacity: 0 }, // from
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: "back.out(1.7)",
      }, // to
      0.2
    );
    
  }, { scope: containerRef });
  
  const handleStart = () => {
    const tl = gsap.timeline();
    tl.to(containerRef.current, {
      opacity: 0,
      y: -40,
      duration: 0.5,
      ease: "power2.in",
      onComplete: onStart
    });
  };

  return (
    <div ref={containerRef} className="space-y-8 text-center">
      <div className="text-center space-y-2 anim-in">
        <h2 className="text-3xl font-bold text-slate-800">Discussion Topic</h2>
        <p className="text-slate-600">Get ready to discuss the following topic</p>
      </div>
      
      <div className="topic-card bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
        <div className="text-2xl font-medium text-gray-900 mb-6 leading-relaxed">
          "Should school students be required to wear uniforms?"
        </div>
        
        <div className="flex justify-center gap-12 mt-8 text-center">
          <div className="space-y-1">
            <div className="text-sm font-medium text-slate-500">Duration</div>
            <div className="text-lg font-semibold text-slate-800">15 Minutes</div>
          </div>
          <div className="h-12 w-px bg-slate-200"></div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-slate-500">Participants</div>
            <div className="text-lg font-semibold text-slate-800">{studentCount} Students</div>
          </div>
        </div>
      </div>
      
      <div className="pt-4 anim-in">
        <Button 
          onClick={handleStart}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="relative overflow-hidden px-10 py-6 text-lg font-semibold bg-black hover:bg-gray-800 transition-all duration-500 transform hover:scale-105 group"
        >
          <span className="relative z-10 flex items-center text-white">
            Start Discussion
            <svg 
              className={`ml-2 w-5 h-5 transition-transform duration-300 ${isHovering ? 'translate-x-1' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        </Button>
      </div>
    </div>
  );
};

export function Lumina() {
  const [stage, setStage] = useState('welcome');
  const [prevStage, setPrevStage] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState(4);
  const [studentNames, setStudentNames] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle stage transitions
  const transitionTo = (newStage: string) => {
    setPrevStage(stage);
    setStage(newStage);
  };

  const handleStudentCountNext = (count: number) => {
    setStudentCount(count);
    transitionTo('voiceReg');
  };

  const handleVoiceRegComplete = (names: string[]) => {
    setStudentNames(names);
    transitionTo('topicIntro');
  };

  const handleStartDiscussion = () => {
    transitionTo('discussion');
  };
  
  // Add page transition effect
  useGSAP(() => {
    if (!containerRef.current) return;
    
    // Initial animation
    if (stage === 'welcome') {
      gsap.from(containerRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power2.out"
      });
    }
  }, { scope: containerRef, dependencies: [stage] });

  // Render the appropriate screen based on stage
  const renderStage = () => {
    switch (stage) {
      case 'welcome':
        return <WelcomeScreen onGetStarted={() => transitionTo('studentCount')} />;
      case 'studentCount':
        return <StudentCountScreen onNext={handleStudentCountNext} />;
      case 'voiceReg':
        return (
          <VoiceRegistrationScreen 
            studentCount={studentCount} 
            onComplete={handleVoiceRegComplete} 
          />
        );
      case 'topicIntro':
        return (
          <TopicIntroductionScreen 
            studentCount={studentCount} 
            onStart={handleStartDiscussion} 
          />
        );
      case 'discussion':
        return <DiscussionView studentNames={studentNames} />;
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      {renderStage()}
    </div>
  );
}