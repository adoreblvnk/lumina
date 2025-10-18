import { experimental_generateSpeech as generateSpeech } from 'ai';
import { createElevenLabs } from '@ai-sdk/elevenlabs';
import { NextRequest, NextResponse } from 'next/server';

const elevenlabs = createElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text to speak is required' }, { status: 400 });
    }

    const { audio } = await generateSpeech({
      model: elevenlabs.speech('eleven_multilingual_v2'),
      text: text,
      voice: 'Rachel',
      speed: 0.1,
    });

    const base64Audio = Buffer.from(audio).toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json({ audioUrl: audioDataUrl });
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
