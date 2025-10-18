import { NextRequest, NextResponse } from 'next/server';
import { createGroq } from '@ai-sdk/groq';
import { elevenlabs } from '@ai-sdk/elevenlabs';
import { experimental_transcribe as transcribe } from 'ai';
import { generateText } from 'ai';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export const dynamic = 'force-dynamic';

// In-memory store for conversation history and silence tracking
let conversationHistory = "";
let silenceStreak = 0;
const SILENCE_THRESHOLD = 2; // 2 consecutive silent chunks trigger an intervention

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get('audio') as Blob;
    const prompt = formData.get('prompt') as string;
    const discussionMode = formData.get('discussionMode') as 'Breadth' | 'Depth';

    if (!audioBlob || !prompt) {
      return NextResponse.json({ error: 'Missing audio blob or discussion prompt' }, { status: 400 });
    }

    // 1. Transcribe the incoming audio chunk
    const { text: transcript } = await transcribe({
      model: elevenlabs.transcription('scribe_v1'),
      audio: await audioBlob.arrayBuffer(),
    });

    // Handle silence
    if (!transcript.trim()) {
      silenceStreak++;
      if (silenceStreak >= SILENCE_THRESHOLD) {
        silenceStreak = 0; // Reset streak after intervention
        // Generate a mild intervention for silence
        const interventionSuggestion = `It's been a bit quiet. Maybe we can discuss how the topic of "${prompt}" relates to our own experiences?`;
        
        // Notify the teacher dashboard about the intervention
        fetch('http://localhost:3001/alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `A group has been silent. Suggestion: ${interventionSuggestion}` }),
        }).catch(err => console.error("Failed to send teacher alert for silence:", err));

        return NextResponse.json({
          status: 'intervention',
          transcript: '',
          isOffTopic: false,
          isImbalanced: false,
          keyTopics: [],
          interventionSuggestion: interventionSuggestion,
        });
      }
      return NextResponse.json({ status: 'silence', transcript: '' });
    }

    // If there's speech, reset the silence streak
    silenceStreak = 0;

    // Append the new transcript to the history for context
    conversationHistory += transcript + " ";

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

        If "isOffTopic" or "isImbalanced" is true, provide a concise, supportive "interventionSuggestion" to guide the students back on track. For example: "That's an interesting perspective. How does it relate to the core topic of school uniforms?" or "We've covered the financial aspect well. What are some arguments for or against uniforms related to school identity?". Otherwise, "interventionSuggestion" should be null.
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