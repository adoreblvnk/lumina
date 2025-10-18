"use client";

import { Button } from "@/components/ui/button";
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Orb } from "@/components/ui/orb";
import { DiscussionView } from "./DiscussionView";
const useMountReveal = () => {
  React.useEffect(() => {
    const tl = gsap.timeline();
    tl.from(".lumina-title", { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" })
      .from(".lumina-subtitle", { y: 12, opacity: 0, duration: 0.4 }, "<0.1")
      .from(".lumina-cta", { y: 10, opacity: 0, duration: 0.4 }, "<0.05");
    return () => tl.kill();
  }, []);
};

const WelcomeScreen = ({ onGetStarted }: { onGetStarted: () => void }) => {
  useMountReveal();
  return (
    <div className="text-center">
      <h1 className="lumina-title text-5xl font-extrabold tracking-tight">Lumina</h1>
      <p className="lumina-subtitle text-base mt-2 opacity-80">AI Discussion Facilitator for small-group learning</p>
      <p className="mt-4 max-w-md mx-auto">
        Lumina keeps your discussion focused and inclusive with real-time, supportive interventions.
      </p>
      <Button onClick={onGetStarted} className="lumina-cta mt-6">
        Get Started
      </Button>
    </div>
  );
};

const StudentCountScreen = ({ onNext }: { onNext: (count: number) => void }) => {
  const [studentCount, setStudentCount] = useState(4);

  const increment = () => setStudentCount(prev => prev + 1);
  const decrement = () => setStudentCount(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold">How many students are in your group?</h2>
      <div className="flex items-center justify-center gap-4 mt-4">
        <Button onClick={decrement}>-</Button>
        <span className="text-2xl font-bold">{studentCount}</span>
        <Button onClick={increment}>+</Button>
      </div>
      <Button onClick={() => onNext(studentCount)} className="mt-6">
        Next: Voice Registration
      </Button>
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

const TopicIntroductionScreen = ({ studentCount, onStart }: { studentCount: number, onStart: () => void }) => (
  <div className="text-center">
    <h2 className="text-2xl font-bold">Discussion Topic</h2>
    <p className="mt-4 text-lg max-w-lg mx-auto">
      "Should school students be forced to wear school uniforms?"
    </p>
    <div className="flex justify-center gap-8 mt-6">
      <div>
        <p className="font-bold">Duration</p>
        <p>15 Minutes</p>
      </div>
      <div>
        <p className="font-bold">Participants</p>
        <p>{studentCount} Students</p>
      </div>
    </div>
    <Button onClick={onStart} className="mt-8">
      Start Discussion
    </Button>
  </div>
);

export function Lumina() {
  const [stage, setStage] = useState('welcome');
  const [studentCount, setStudentCount] = useState(4);
  const [studentNames, setStudentNames] = useState<string[]>([]);

  const handleStudentCountNext = (count: number) => {
    setStudentCount(count);
    setStage('voiceReg');
  };

  const handleVoiceRegComplete = (names: string[]) => {
    setStudentNames(names);
    setStage('topicIntro');
  };

  const handleStartDiscussion = () => {
    setStage('discussion');
  };

  if (stage === 'welcome') {
    return <WelcomeScreen onGetStarted={() => setStage('studentCount')} />;
  }

  if (stage === 'studentCount') {
    return <StudentCountScreen onNext={handleStudentCountNext} />;
  }

  if (stage === 'voiceReg') {
    return <VoiceRegistrationScreen studentCount={studentCount} onComplete={handleVoiceRegComplete} />;
  }

  if (stage === 'topicIntro') {
    return <TopicIntroductionScreen studentCount={studentCount} onStart={handleStartDiscussion} />;
  }

  if (stage === 'discussion') {
    return <DiscussionView studentNames={studentNames} />;
  }

  return (
    <div className={"flex justify-center items-center gap-x-10"}>
      <Card className={"rounded-3xl"}>
        <CardContent>
          <CardHeader>
            <CardTitle className={"text-center py-2"}>
              Lumina
            </CardTitle>
          </CardHeader>
          <div className={"flex flex-col gap-y-4 text-center items-center"}>
            <Orb agentState={null} className={"w-[250px] h-[250px]"} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
