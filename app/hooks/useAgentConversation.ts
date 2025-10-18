'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useVoiceStream } from 'voice-stream';
import type { ElevenLabsWebSocketEvent } from '../types/websocket';

const sendMessage = (websocket: WebSocket, request: object) => {
  if (websocket.readyState !== WebSocket.OPEN) {
    return;
  }
  websocket.send(JSON.stringify(request));
};

export type AgentConversationCallbacks = {
    onUserTranscript?: (transcript: string) => void;
    onAgentResponse?: (response: string) => void;
    onAgentResponseCorrection?: (correctedResponse: string) => void;
    onInterruption?: (reason: string) => void;
    onAudioChunk?: (audio_base_64: string) => void;
};

export const useAgentConversation = (callbacks: AgentConversationCallbacks = {}) => {
  const websocketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const { startStreaming, stopStreaming } = useVoiceStream({
    onAudioChunked: (audioData) => {
      if (!websocketRef.current) return;
      sendMessage(websocketRef.current, {
        user_audio_chunk: audioData,
      });
    },
  });

  const startConversation = useCallback(async () => {
    if (isConnected) return;

    try {
      const response = await fetch('/api/signed-url');
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to get signed URL:', error);
        return;
      }
      const { signedUrl } = await response.json();

      const websocket = new WebSocket(signedUrl);

      websocket.onopen = async () => {
        setIsConnected(true);
        sendMessage(websocket, {
          type: "conversation_initiation_client_data",
        });
        await startStreaming();
      };

      websocket.onmessage = async (event) => {
        const data = JSON.parse(event.data) as ElevenLabsWebSocketEvent;
        // Handle ping events to keep connection alive
        if (data.type === "ping") {
          setTimeout(() => {
            sendMessage(websocket, {
              type: "pong",
              event_id: data.ping_event.event_id,
            });
          }, data.ping_event.ping_ms);
        }
        if (data.type === "user_transcript") {
          const { user_transcription_event } = data;
          console.log("User transcript", user_transcription_event.user_transcript);
          callbacks.onUserTranscript?.(user_transcription_event.user_transcript);
        }
        if (data.type === "agent_response") {
          const { agent_response_event } = data;
          console.log("Agent response", agent_response_event.agent_response);
          callbacks.onAgentResponse?.(agent_response_event.agent_response);
        }
        if (data.type === "agent_response_correction") {
          const { agent_response_correction_event } = data;
          console.log("Agent response correction", agent_response_correction_event.corrected_agent_response);
          callbacks.onAgentResponseCorrection?.(agent_response_correction_event.corrected_agent_response);
        }
        if (data.type === "interruption") {
          const { interruption_event } = data;
          callbacks.onInterruption?.(interruption_event.reason);
        }
        if (data.type === "audio") {
          const { audio_event } = data;
          callbacks.onAudioChunk?.(audio_event.audio_base_64);
        }
      };

      websocketRef.current = websocket;

      websocket.onclose = async () => {
        websocketRef.current = null;
        setIsConnected(false);
        stopStreaming();
      };
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  }, [startStreaming, stopStreaming, callbacks]);

  const stopConversation = useCallback(async () => {
    if (!websocketRef.current) return;
    websocketRef.current.close();
  }, []);

  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  return {
    startConversation,
    stopConversation,
    isConnected,
  };
};