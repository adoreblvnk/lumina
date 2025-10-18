# Lumina: AI Discussion Facilitator

## Commands
- **Dev**: `bun run dev` (uses turbopack)
- **Build**: `bun run build`
- **Lint**: `bun run lint`
- **Package Manager**: Use `bun`, NOT `npm`
- **Note**: Do NOT run bun commands yourself—let the user execute them

## Architecture
- **Framework**: Next.js 15 (App Router) with TypeScript
- **API Routes**: `/app/api/*` handles all backend logic (generate-speech, transcribe-name, analyze-discussion, signed-url)
- **AI Services**: Groq (transcription/analysis), ElevenLabs (TTS), OpenAI (fallback), Vercel AI SDK
- **WebSocket**: `websocket-server.js` for real-time communication
- **Components**: React with shadcn/ui components in `/components/ui`
- **State**: Custom hooks in `/app/hooks`

## Code Style
- **Imports**: Use `@/*` path alias for internal imports (e.g., `import { cn } from "@/lib/utils"`)
- **Types**: Strict TypeScript (`strict: true`), define types in `/app/types`
- **Error Handling**: Return `Response` objects with appropriate status codes in API routes
- **Formatting**: Use Tailwind CSS utilities with `cn()` helper for conditional classes
- **Naming**: PascalCase for components, camelCase for functions/variables
- **No Comments**: Avoid code comments unless complexity requires it
