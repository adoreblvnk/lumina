import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { NextRequest } from 'next/server';
import { PassThrough } from 'stream';

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return new Response('Text to speak is required', { status: 400 });
    }

    const audioStream = await elevenlabs.textToSpeech.stream('mbL34QDB5FptPamlgvX5', {
      modelId: 'eleven_multilingual_v2',
      text,
      outputFormat: 'mp3_44100_128',
      voiceSettings: {
        stability: 0,
        similarityBoost: 1.0,
        useSpeakerBoost: true,
        speed: 1.0,
      },
    });

    const passThrough = new PassThrough();
    
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      passThrough.write(chunk);
      chunks.push(chunk);
    }
    passThrough.end();

    // Correctly create a streaming response
    const response = new Response(passThrough as any, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

    return response;

  } catch (error) {
    console.error('Error generating speech:', error);
    return new Response('Failed to generate speech', { status: 500 });
  }
}