"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Components ---

const DiscussionDepth = ({ depth }: { depth: number }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-bold">Discussion Depth</h3>
    <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
      <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${depth}%` }} />
    </div>
    <p className="text-right mt-1">{depth}%</p>
  </div>
);

const KeyTopics = ({ topics }: { topics: { name: string, confidence: number }[] }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-bold">Key Topics</h3>
    <div className="space-y-2 mt-2">
      {topics.map((topic, index) => (
        <div key={index}>
          <p>{topic.name}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${topic.confidence}%` }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Metrics = ({ questions, insights }: { questions: number, insights: number }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-bold">Metrics</h3>
    <div className="flex justify-around mt-2">
      <div className="text-center"><p className="text-2xl font-bold">{questions}</p><p>Questions Asked</p></div>
      <div className="text-center"><p className="text-2xl font-bold">{insights}</p><p>Key Insights</p></div>
    </div>
  </div>
);

const Participants = ({ names }: { names: string[] }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-bold">Participants</h3>
    <ul className="list-disc list-inside mt-2 space-y-1">
      {names.map((name, index) => (<li key={index}>{name}</li>))}
    </ul>
  </div>
);

interface DiscussionViewProps {
  studentNames: string[];
}

export const DiscussionView = ({ studentNames }: DiscussionViewProps) => {
  const [timeRemaining, setTimeRemaining] = useState(15 * 60);
  const [aiWantsToSpeak, setAiWantsToSpeak] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [discussionDepth, setDiscussionDepth] = useState(65);
  const [keyTopics, setKeyTopics] = useState([{ name: "Student Expression", confidence: 85 },{ name: "Cost to Families", confidence: 70 },{ name: "School Safety", confidence: 50 }]);
  const [questionsAsked, setQuestionsAsked] = useState(5);
  const [keyInsights, setKeyInsights] = useState(3);
  const [currentSpeaker, setCurrentSpeaker] = useState("None");
  
  const ws = useRef<WebSocket | null>(null);
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:3001');
    audioPlayer.current = new Audio();

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      ws.current?.send(JSON.stringify({ type: 'INIT', payload: { studentNames } }));
      startRecording();
    };

    ws.current.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const message = JSON.parse(event.data);
        if (message.type === 'transcript') {
          const speakerName = studentNames[message.speaker - 1] || `Student ${message.speaker}`;
          setCurrentSpeaker(speakerName);
        } else if (message.type === 'intervention_suggestion') {
          setAiWantsToSpeak(true);
          setAiMessage(message.payload || "Lumina has a suggestion."); // Use payload or a generic message
        }
      } else if (event.data instanceof Blob) {
        // This is audio data for a severe intervention
        console.log('[Audio] Received audio from server.');
        const audioUrl = URL.createObjectURL(event.data);
        if (audioPlayer.current) {
          setAiWantsToSpeak(false);
          setAiSpeaking(true);
          setAiMessage("Lumina is speaking..."); // Placeholder message
          audioPlayer.current.src = audioUrl;
          audioPlayer.current.play();
          audioPlayer.current.onended = () => {
            setAiSpeaking(false);
            setAiMessage("");
          };
        }
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      stopRecording();
    };

    const timer = setInterval(() => {
      setTimeRemaining(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timer);
      if (ws.current) ws.current.close();
      stopRecording();
    };
  }, [studentNames]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(event.data);
          console.log(`[Audio] Sent ${event.data.size} byte audio chunk to server.`);
        }
      };
      
      // Start recording, firing ondataavailable every 20 seconds
      mediaRecorderRef.current.start(20000); 

    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleLetAiSpeak = () => {
    // The server sends audio directly for severe interventions.
    // For mild ones, we just show the text. This button can be a "show suggestion" button.
    setAiWantsToSpeak(false);
    setAiSpeaking(true); // We'll just display the message the server sent.
    setTimeout(() => {
      setAiSpeaking(false);
      setAiMessage("");
    }, 5000); // Hide message after 5 seconds
  };

  const handleDismiss = () => {
    setAiWantsToSpeak(false);
    setAiMessage("");
  };

  return (
    <div className="grid grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
      <div className="col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div><h2 className="text-xl font-bold">Discussion Topic</h2><p className="mt-2 text-lg">"Should school students be forced to wear school uniforms?"</p></div>
            <div className="text-right"><p className="font-bold">Time Remaining</p><p className="text-2xl">{formatTime(timeRemaining)}</p></div>
          </div>
          <div className="mt-4"><p className="font-bold">Current Speaker</p><p>{currentSpeaker}</p></div>
          {aiWantsToSpeak && (
            <div className="mt-4 p-4 bg-blue-100 rounded-lg flex justify-between items-center">
              <p>{aiMessage}</p>
              <div><Button onClick={handleLetAiSpeak}>Show</Button><Button onClick={handleDismiss} variant="ghost">Dismiss</Button></div>
            </div>
          )}
          {aiSpeaking && (
            <div className="mt-4 p-4 bg-green-100 rounded-lg"><p className="font-bold">Lumina says:</p><p>{aiMessage}</p></div>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold">Group Notes</h2>
          <textarea className="w-full h-48 mt-2 p-2 border rounded" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Start typing your group's notes here..." />
        </div>
      </div>
      <div className="col-span-1 space-y-6">
        <Participants names={studentNames} />
        <DiscussionDepth depth={discussionDepth} />
        <KeyTopics topics={keyTopics} />
        <Metrics questions={questionsAsked} insights={keyInsights} />
      </div>
    </div>
  );
};
