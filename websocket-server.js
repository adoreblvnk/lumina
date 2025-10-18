import { createGroq } from '@ai-sdk/groq';
import { createElevenLabs } from '@ai-sdk/elevenlabs';
import { streamText, experimental_generateSpeech as generateSpeech, experimental_transcribe as transcribe } from 'ai';
import dotenv from 'dotenv';

dotenv.config();

// AI Service Initializations
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const elevenlabs = createElevenLabs({ apiKey: process.env.ELEVENLABS_API_KEY });

// Constants
const ANALYSIS_INTERVAL = 20000; // This is now just for the client-side batching
const DISCUSSION_PROMPT = "Should school students be forced to wear school uniforms?";

const teacherClients = new Set();
const groupClients = new Set();

const broadcastToTeachers = (message) => {
  console.log('[Broadcast] Sending message to teacher dashboard.');
  teacherClients.forEach((client) => {
    client.send(message);
  });
};

console.log("Starting Bun WebSocket server...");

Bun.serve({
  port: 3001,
  
  fetch(req, server) {
    const url = new URL(req.url);
    const channel = url.searchParams.get('channel');
    const success = server.upgrade(req, { data: { channel } });
    if (success) return;
    return new Response("WebSocket server is running.");
  },

  websocket: {
    open(ws) {
      const { channel } = ws.data;
      if (channel === 'teacher') {
        console.log('[Connect] Teacher dashboard connected.');
        teacherClients.add(ws);
      } else {
        console.log('[Connect] Group client connected.');
        groupClients.add(ws);
        ws.data.state = {
          studentNames: [],
          transcriptBuffer: [], // Buffer for text, not audio
          silenceCount: 0,
          offTopicCount: 0,
        };
      }
    },

    async message(ws, rawData) {
        const { state } = ws.data;

        const initializeDiscussion = (names) => {
            state.studentNames = names;
            console.log(`[Init] Discussion started with: ${names.join(', ')}.`);
        };

        const analyzeTranscriptChunk = async () => {
            console.log(`\n--- [Analysis Cycle Started: ${new Date().toLocaleTimeString()}] ---`);
            
            if (state.transcriptBuffer.length === 0) {
              state.silenceCount++;
              console.log(`[Analysis Result] SILENCE detected. Consecutive silence count: ${state.silenceCount}`);

              if (state.silenceCount === 3) { // Severe intervention after 60s
                console.log("[Intervention] Triggering SEVERE intervention for prolonged silence.");
                const interventionPrompt = `The students discussing "${DISCUSSION_PROMPT}" have been silent for a minute. Generate a concise, encouraging question to re-engage them and get them talking again.`;
                
                const { text } = await streamText({ model: groq.chat('llama3-8b-8192'), prompt: interventionPrompt });
                
                console.log(`[AI] Generated intervention: "${text}"`);
                
                const speech = await generateSpeech({
                  model: elevenlabs.speech('eleven-multilingual-v2'),
                  voice: 'Rachel',
                  text,
                });

                // Convert stream to buffer to send over WebSocket
                const audioBuffer = Buffer.from(await speech.arrayBuffer());
                ws.send(audioBuffer); // Send audio data directly
                
                broadcastToTeachers(JSON.stringify({
                  type: 'alert',
                  payload: {
                    groupId: 'Group 1', // Replace with actual group identifier
                    message: 'Severe intervention: Prolonged silence.',
                    intervention: text,
                  }
                }));
                state.silenceCount = 0; // Reset after severe intervention

              } else if (state.silenceCount === 2) { // Mild intervention after 40s
                console.log("[Intervention] Triggering MILD intervention for silence.");
                ws.send(JSON.stringify({ type: 'intervention_suggestion' }));
              }
              return;
            }
    
            // If we receive text, reset the silence counter
            state.silenceCount = 0;
            const fullTranscript = state.transcriptBuffer.map(t => t.text).join(' ');
            console.log(`[Analysis] Full transcript for this chunk: "${fullTranscript}"`);
    
            // --- Off-Topic Analysis ---
            const offTopicResult = await streamText({
              model: groq.chat('llama3-8b-8192'),
              prompt: `You are an AI classroom assistant. The students are supposed to be discussing: "${DISCUSSION_PROMPT}". Their latest conversation is: "${fullTranscript}". Is their conversation on topic? Respond with only "ON_TOPIC" or "OFF_TOPIC".`
            });
            const offTopicStatus = await offTopicResult.text;
            console.log(`[Analysis Result] Off-Topic Status: ${offTopicStatus}`);

            if (offTopicStatus.includes('OFF_TOPIC')) {
              state.offTopicCount++;
              if (state.offTopicCount >= 2) { // Severe intervention
                console.log("[Intervention] Triggering SEVERE intervention for being off-topic.");
                const interventionPrompt = `The students are off-topic from "${DISCUSSION_PROMPT}". Their current conversation is about: "${fullTranscript}". Generate a concise, friendly prompt to gently guide them back to the main topic.`;
                const { text } = await streamText({ model: groq.chat('llama3-8b-8192'), prompt: interventionPrompt });
                
                const speech = await generateSpeech({ model: elevenlabs.speech('eleven-multilingual-v2'), voice: 'Rachel', text });
                const audioBuffer = Buffer.from(await speech.arrayBuffer());
                ws.send(audioBuffer);
                
                broadcastToTeachers(JSON.stringify({
                  type: 'alert',
                  payload: { groupId: 'Group 1', message: 'Severe intervention: Off-topic.', intervention: text }
                }));
                state.offTopicCount = 0; // Reset after severe intervention
              } else { // Mild intervention
                console.log("[Intervention] Triggering MILD intervention for being off-topic.");
                ws.send(JSON.stringify({ type: 'intervention_suggestion' }));
              }
            } else {
              state.offTopicCount = 0; // Reset if on-topic
            }

            // --- Imbalance Analysis (Breadth Mode) ---
            const speakerTurns = state.transcriptBuffer.reduce((acc, curr) => {
              const speakerName = state.studentNames[curr.speaker] || `Speaker ${curr.speaker}`;
              acc[speakerName] = (acc[speakerName] || 0) + 1;
              return acc;
            }, {});
            console.log('[Analysis] Speaker turns:', speakerTurns);

            const imbalancePrompt = `You are an AI discussion analyst. The students are: ${state.studentNames.join(', ')}. Here is a summary of who spoke: ${JSON.stringify(speakerTurns)}. The discussion prompt is "${DISCUSSION_PROMPT}". Analyze the participation balance. Is anyone dominating or is anyone too quiet? If the discussion is imbalanced, provide a short, encouraging question to ask a specific student who has spoken less to get their opinion. If the balance is good, respond with only the word "BALANCED".`;
            
            const imbalanceResult = await streamText({ model: groq.chat('llama3-8b-8192'), prompt: imbalancePrompt });
            const imbalanceSuggestion = await imbalanceResult.text;

            if (!imbalanceSuggestion.includes('BALANCED')) {
              console.log(`[Intervention] Triggering MILD intervention for imbalance. Suggestion: ${imbalanceSuggestion}`);
              ws.send(JSON.stringify({ type: 'intervention_suggestion', payload: imbalanceSuggestion }));
            } else {
              console.log('[Analysis Result] Participation is BALANCED.');
            }
    
            state.transcriptBuffer = []; // Clear transcript buffer for the next cycle
            console.log("--- [Analysis Cycle Ended] ---");
        };

        // --- Message Handling ---
        try {
          const message = JSON.parse(rawData.toString());
          if (message.type === 'INIT') {
            console.log('[Message] Received INIT message from client.');
            initializeDiscussion(message.payload.studentNames);
            return;
          }
        } catch (e) {
          // If it's not JSON, it's a webm audio file
          console.log(`[Audio] Received ${rawData.byteLength} byte webm file from client.`);
          const audioUint8Array = new Uint8Array(rawData);

          try {
            console.log('[API Call] Transcribing audio with ElevenLabs...');
            const { results } = await transcribe({
              model: elevenlabs.transcription('scribe_v1'),
              audio: audioUint8Array,
              providerOptions: { elevenlabs: { diarize: true, numSpeakers: state.studentNames.length } },
            });


            if (results && results.length > 0) {
                console.log(`[API Success] Transcription successful. Found ${results.length} segments.`);
                // Since this is a 20-second chunk, we can analyze it right away
                const transcriptForAnalysis = [];
                for (const result of results) {
                  if (result.text.trim()) {
                    const speakerId = result.speaker;
                    const transcriptText = result.text;
                    console.log(`[Transcription] Speaker ${speakerId} (${state.studentNames[speakerId]}): "${transcriptText}"`);
                    transcriptForAnalysis.push({ text: transcriptText, speaker: speakerId });
                    ws.send(JSON.stringify({ type: 'transcript', data: transcriptText, speaker: speakerId + 1 }));
                  }
                }
                // Pass the new transcript to the analysis logic
                state.transcriptBuffer = transcriptForAnalysis;
                analyzeTranscriptChunk();

            } else {
                console.log('[API Success] Transcription returned no text.');
                // Treat as silence
                analyzeTranscriptChunk();
            }
          } catch (error) {
            console.error("[API Error] Error during transcription:", error);
          }
        }
    },

    close(ws, code, reason) {
      const { channel } = ws.data;
      if (channel === 'teacher') {
        console.log(`[Disconnect] Teacher dashboard disconnected.`);
        teacherClients.delete(ws);
      } else {
        console.log(`[Disconnect] Group client disconnected.`);
        groupClients.delete(ws);
      }
    },
  },
});

console.log("WebSocket server listening on ws://localhost:3001");