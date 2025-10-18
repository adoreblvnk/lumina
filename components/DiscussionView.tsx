"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

// --- Sub-components for UI ---

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
      {topics.length > 0 ? topics.map((topic, index) => (
        <div key={index}>
          <p>{topic.name}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${topic.confidence}%` }} />
          </div>
        </div>
      )) : <p>No topics identified yet.</p>}
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
  const [discussionDepth, setDiscussionDepth] = useState(0);
  const [keyTopics, setKeyTopics] = useState<{ name: string, confidence: number }[]>([]);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [keyInsights, setKeyInsights] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState("Analysis in progress...");
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const prevAiWantsToSpeakRef = useRef(false);

  const discussionPrompt = "Should school students be forced to wear school uniforms?";
  const discussionMode = "Breadth";

  // Function to play bell sound using Web Audio API
  const playBellSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create multiple oscillators for a richer bell sound
    const frequencies = [800, 1000, 1200];
    const now = audioContext.currentTime;
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      // Create envelope for bell-like decay
      gainNode.gain.setValueAtTime(0.3 / (index + 1), now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1);
      
      oscillator.start(now);
      oscillator.stop(now + 1);
    });
  }, []);

  // Play bell sound when aiWantsToSpeak changes from false to true
  useEffect(() => {
    if (aiWantsToSpeak && !prevAiWantsToSpeakRef.current) {
      playBellSound();
    }
    prevAiWantsToSpeakRef.current = aiWantsToSpeak;
  }, [aiWantsToSpeak, playBellSound]);

  // Function to process audio for transcription only (no analysis)
  const processAudioTranscription = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    audioChunksRef.current = [];

    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('prompt', discussionPrompt);
    formData.append('discussionMode', discussionMode);
    formData.append('transcribeOnly', 'true'); // Flag for transcription only

    try {
      const response = await fetch('/api/analyze-discussion', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('API request failed');
      
      const result = await response.json();
      
      if (result.transcript) {
        setTranscripts(prev => [...prev, result.transcript]);
        if (result.transcript.includes('?')) setQuestionsAsked(prev => prev + 1);
      }

    } catch (error) {
      console.error("Error during audio transcription:", error);
    }
  }, []);

  // Function to process audio for full analysis
  const processAudioAndAnalyze = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    audioChunksRef.current = [];

    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('prompt', discussionPrompt);
    formData.append('discussionMode', discussionMode);
    formData.append('transcribeOnly', 'false'); // Flag for full analysis

    try {
      const response = await fetch('/api/analyze-discussion', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('API request failed');
      
      const result = await response.json();
      
      if (result.transcript) {
        setTranscripts(prev => [...prev, result.transcript]);
        if (result.transcript.includes('?')) setQuestionsAsked(prev => prev + 1);
      }

      if (result.keyTopics) setKeyTopics(result.keyTopics);
      
      setDiscussionDepth(prev => Math.min(100, prev + 2));

      if (result.interventionSuggestion && !aiWantsToSpeak && !aiSpeaking) {
        setAiMessage(result.interventionSuggestion);
        setAiWantsToSpeak(true);
        // Stop the analysis interval when AI wants to speak
        if (analysisIntervalRef.current) {
          clearInterval(analysisIntervalRef.current);
          analysisIntervalRef.current = null;
        }
      }

    } catch (error) {
      console.error("Error during audio analysis:", error);
    }
  }, [aiWantsToSpeak, aiSpeaking]);

  const startTranscriptionInterval = useCallback(() => {
    // Clear any existing interval
    if (transcriptionIntervalRef.current) {
      clearInterval(transcriptionIntervalRef.current);
    }

    // Start transcription interval (every 7 seconds)
    transcriptionIntervalRef.current = setInterval(() => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        processAudioTranscription();
        mediaRecorderRef.current.start();
      }
    }, 7000);
  }, [processAudioTranscription]);

  const startAnalysisInterval = useCallback(() => {
    // Clear any existing interval
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }

    // Start analysis interval (every 15 seconds)
    analysisIntervalRef.current = setInterval(() => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        processAudioAndAnalyze();
        mediaRecorderRef.current.start();
      }
    }, 15000);
  }, [processAudioAndAnalyze]);

  const startConversation = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.start();

      // Make an initial transcription call after 3 seconds for immediate feedback
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          processAudioTranscription();
          mediaRecorderRef.current.start();
        }
        // Start the regular transcription interval (7 seconds)
        startTranscriptionInterval();
      }, 3000);

      // Make an initial analysis call after 5 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          processAudioAndAnalyze();
          mediaRecorderRef.current.start();
        }
        // Start the regular analysis interval (15 seconds)
        startAnalysisInterval();
      }, 5000);

    } catch (error) {
      console.error('Failed to get microphone access:', error);
      alert("Microphone access is required to start the discussion.");
    }
  }, [startTranscriptionInterval, startAnalysisInterval, processAudioTranscription, processAudioAndAnalyze]);

  const stopConversation = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current);
    if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    setIsRecording(false);
    processAudioAndAnalyze();
  }, [processAudioAndAnalyze]);

  useEffect(() => {
    audioPlayerRef.current = new Audio();
    const timer = setInterval(() => setTimeRemaining(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    
    startConversation();

    return () => {
      clearInterval(timer);
      stopConversation();
    };
  }, [startConversation, stopConversation]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleLetAiSpeak = async () => {
    if (!aiMessage) return;
    setAiWantsToSpeak(false);
    setAiSpeaking(true);
    try {
        const response = await fetch('/api/generate-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: aiMessage }),
        });
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioPlayerRef.current) {
            audioPlayerRef.current.src = audioUrl;
            audioPlayerRef.current.play();
            audioPlayerRef.current.onended = () => {
                setAiSpeaking(false);
                setAiMessage("");
                URL.revokeObjectURL(audioUrl);
                // Restart the analysis interval after AI finishes speaking
                startAnalysisInterval();
            };
        }
    } catch (error) {
        console.error("Speech generation failed:", error);
        setAiSpeaking(false);
        // Restart interval even if there's an error
        startAnalysisInterval();
    }
  };

  const handleDismiss = () => {
    setAiWantsToSpeak(false);
    setAiMessage("");
    // Restart the analysis interval after dismissing
    startAnalysisInterval();
  };

  return (
    <div className="grid grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
      <div className="col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div><h2 className="text-xl font-bold">Discussion Topic</h2><p className="mt-2 text-lg">"{discussionPrompt}"</p></div>
            <div className="text-right"><p className="font-bold">Time Remaining</p><p className="text-2xl">{formatTime(timeRemaining)}</p></div>
          </div>
          <p>Status: {isRecording ? 'Live analysis is active.' : 'Starting...'}</p>
          <div className="mt-4"><p className="font-bold">Live Transcript</p>
            <div className="mt-1 h-24 overflow-y-auto bg-gray-50 p-2 rounded border">
              {transcripts.length > 0 ? transcripts.map((t, i) => <p key={i}>{t}</p>) : "..."}
            </div>
          </div>
          {aiWantsToSpeak && !aiSpeaking && ( 
            <div className="mt-4 p-4 bg-blue-100 rounded-lg flex justify-between items-center">
              <p>Lumina has a suggestion!</p>
              <div><Button onClick={handleLetAiSpeak}>Let Lumina Speak</Button><Button onClick={handleDismiss} variant="ghost">Dismiss</Button></div>
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