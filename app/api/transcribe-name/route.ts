import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const audioBlob = await req.blob();

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model_id', 'scribe_v1');
    // The following parameters are based on what the ai-sdk was sending.
    formData.append('language_code', 'en');
    formData.append('tag_audio_events', 'false');
    formData.append('timestamps_granularity', 'none');
    formData.append('diarize', 'false');

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`ElevenLabs API error: ${response.status} ${response.statusText}`, errorBody);
      try {
        const errorJson = JSON.parse(errorBody);
        return NextResponse.json({ error: errorJson.detail?.message || 'Failed to transcribe audio' }, { status: response.status });
      } catch (e) {
        return NextResponse.json({ error: `Failed to transcribe audio: ${errorBody}` }, { status: response.status });
      }
    }

    const result = await response.json();
    const text = result.text;

    if (typeof text !== 'string') {
        console.error('Could not find transcription string in ElevenLabs response:', result);
        return NextResponse.json({ error: 'Failed to parse transcription from response' }, { status: 500 });
    }

    // Clean up the transcribed text to remove common punctuation
    const cleanedText = text.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

    return NextResponse.json({ name: cleanedText });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
