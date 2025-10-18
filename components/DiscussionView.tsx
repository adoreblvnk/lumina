"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useAgentConversation } from "@/app/hooks/useAgentConversation";
import { ElevenStreamingWeb } from "@/lib/stream";

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
  
  const audioPlayer = useRef<ElevenStreamingWeb | null>(null);

  const { startConversation, stopConversation, isConnected } = useAgentConversation({
    onUserTranscript: (transcript) => {
      console.log("User transcript:", transcript);
      // Diarization is not available in this event, so we can't know who is speaking.
      // We can show the transcript if we want.
    },
    onAgentResponse: (response) => {
      setAiWantsToSpeak(true);
      setAiMessage(response || "Lumina has a suggestion.");
    },
    onAudioChunk: (audio_base_64) => {
      if (!aiSpeaking) {
        setAiWantsToSpeak(false);
        setAiSpeaking(true);
        setAiMessage("Lumina is speaking...");
        audioPlayer.current?.initStream();
      }
      audioPlayer.current?.playChunk({ buffer: audio_base_64 });
    }
  });

  useEffect(() => {
    audioPlayer.current = new ElevenStreamingWeb();

    const timer = setInterval(() => {
      setTimeRemaining(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleStart = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await startConversation();
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [startConversation]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleLetAiSpeak = () => {
    setAiWantsToSpeak(false);
    setAiSpeaking(true);
    // The audio will play via onAudioChunk. We can have a timeout to hide the message.
    setTimeout(() => {
      setAiSpeaking(false);
      setAiMessage("");
    }, 5000); // Assuming audio playback is around 5s
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
          <div className="flex gap-2 my-4">
            <Button onClick={handleStart} disabled={isConnected}>Start Conversation</Button>
            <Button onClick={stopConversation} disabled={!isConnected} variant="destructive">Stop Conversation</Button>
          </div>
          <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
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