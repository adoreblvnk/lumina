import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';
import { createGroq } from '@ai-sdk/groq';
import { elevenlabs } from '@ai-sdk/elevenlabs';
import { experimental_transcribe as transcribe } from 'ai';
import { generateText } from 'ai';
import { ElevenLabsClient, play } from "@elevenlabs/elevenlabs-js";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const elevenlabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export const dynamic = 'force-dynamic';

// In-memory store for conversation history and silence tracking
let conversationHistory = "";
let silenceStreak = 0;
const SILENCE_THRESHOLD = 2; // 2 consecutive silent chunks trigger an intervention


// Helper function to convert ReadableStream to AsyncIterable
async function* streamToAsyncIterable<T>(stream: ReadableStream<T>): AsyncIterable<T> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get('audio') as Blob;
    const prompt = formData.get('prompt') as string;
    const discussionMode = formData.get('discussionMode') as 'Breadth' | 'Depth';
    const transcribeOnly = formData.get('transcribeOnly') === 'true';

    if (!audioBlob || !prompt) {
      return NextResponse.json({ error: 'Missing audio blob or discussion prompt' }, { status: 400 });
    }

    let isolatedAudioBuffer: Buffer;
    try {
      // Isolate the audio before transcription
      const isolatedAudioStream = await elevenlabsClient.audioIsolation.convert({
        audio: audioBlob,
      });

      // Convert the isolated audio stream to a Buffer
      const chunks = [];
      for await (const chunk of streamToAsyncIterable(isolatedAudioStream)) {
        chunks.push(chunk);
      }
      isolatedAudioBuffer = Buffer.concat(chunks);
    } catch (error: any) {
      if (error?.body?.detail?.status === 'invalid_audio_duration') {
        console.log('Audio duration too short for isolation, proceeding with original audio.');
        const arrayBuffer = await audioBlob.arrayBuffer();
        isolatedAudioBuffer = Buffer.from(arrayBuffer);
      } else {
        // For any other errors, re-throw them
        throw error;
      }
    }

    // 1. Transcribe the incoming audio chunk
    let transcript = '';
    try {
      const { text } = await transcribe({
        model: elevenlabs.transcription('scribe_v1'),
        audio: isolatedAudioBuffer,
        providerOptions: {
          elevenlabs: {
            languageCode: 'en',
          },
        },
      });
      transcript = text;
    } catch (error: any) {
      // The `transcribe` function can throw errors when no speech is detected or audio is too short.
      // We treat these as a silent chunk and let the silence handling logic proceed.
      if (
        error.name !== 'AI_NoTranscriptGeneratedError' &&
        !(error.name === 'AI_APICallError' && error.responseBody?.includes('audio_too_short'))
      ) {
        // Re-throw any other unexpected errors.
        throw error;
      }
    }

    // Clean the transcript to remove non-speech text in parentheses (e.g., "(door opens)")
    transcript = transcript.replace(/\s*\([^)]*\)\s*/g, ' ').trim();

    // Handle silence
    if (!transcript.trim()) {
      silenceStreak++;
      if (silenceStreak >= SILENCE_THRESHOLD) {
        silenceStreak = 0; // Reset streak after a long silence
      }
      // Lumina remains silent on silence, per requirements.
      return NextResponse.json({ status: 'silence', transcript: '' });
    }

    // If there's speech, reset the silence streak
    silenceStreak = 0;

    // Append the new transcript to the history for context
    conversationHistory += transcript + " ";

    // If transcribeOnly flag is set, return early without analysis
    if (transcribeOnly) {
      return NextResponse.json({
        transcript,
        status: 'transcribed'
      });
    }

    // 2. Analyze the transcript for intervention triggers using a Groq language model
    const analysisPrompt = `
        You are an AI discussion facilitator. Your role is to analyze a classroom discussion.
        The main discussion topic is: "${prompt}".
        The desired discussion mode is: "${discussionMode}".
        The conversation so far has been: "${conversationHistory}"

        Please analyze the latest part of the conversation: "${transcript}"

        Based on this new information, perform the following tasks:
        1.  Determine if the latest transcript is significantly off-topic from the main prompt.
        2.  If the mode is "Breadth", determine if the discussion is imbalanced and neglecting key viewpoints.
        3.  Identify up to 3 key topics being discussed in the latest transcript.

        Respond with a JSON object ONLY, with the following schema:
        {
          "isOffTopic": boolean,
          "isImbalanced": boolean,
          "keyTopics": Array<{ "name": string, "confidence": number }>,
          "interventionSuggestion": string | null
        }

        If "isOffTopic" is true, provide a concise, supportive "interventionSuggestion" to guide the students back on track. For example: "That's an interesting perspective. How does it relate to the core topic of school uniforms?". Otherwise, "interventionSuggestion" should be null.
    `;

    const { text: analysisResultText } = await generateText({
        model: groq('openai/gpt-oss-20b'),
        prompt: analysisPrompt,
    });

    // Clean and parse the JSON response from the language model
    const cleanedJsonString = analysisResultText.replace(/```json\n|\n```/g, '').trim();
    const analysisResult = JSON.parse(cleanedJsonString);

    // 3. If a severe intervention is triggered, notify the teacher dashboard
    if (analysisResult.interventionSuggestion) {
        fetch('http://localhost:3001/alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `A group discussion may need attention. Suggestion: ${analysisResult.interventionSuggestion}` }),
        }).catch(err => console.error("Failed to send teacher alert:", err));
    }

    return NextResponse.json({
      transcript,
      ...analysisResult,
    });

  } catch (error) {
    console.error('Error in analyze-discussion route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to analyze discussion: ${errorMessage}` }, { status: 500 });
  }
}