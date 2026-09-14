# Little Picnic

A picture-led English speaking game for young children. https://child-english.muveeai.com

## Play loop

The first three encounters model one word: apple, blanket, umbrella. When the model finishes, a visible microphone cue hands the turn to the child. An accepted spoken word moves the object and changes the story. Tapping or dragging only selects an object or requests a model; **ordinary clicks cannot advance a speaking turn**.

The final revisit supplies the same pictures without automatically saying their names. Children can try retrieving the word, or request the model again. The session report separately counts echo turns (a model was requested), picture responses (no model in this turn), and parent-assisted turns. It does not claim mastery, pronunciation accuracy or spontaneous speech. A parent can explicitly assist from the parent dialog when the child needs a break or recognition is unavailable; this is never counted as child speech.

## Run and verify

`npm ci`, `npm start`, then http://localhost:3000. `npm test` checks stage-aware decisions, cache isolation, negation, request validation, and private-file routing. `npm run build` exports assets into `dist/`.

`tests/browser-*.js` are functions for `patchwright-cli run-code`. Open a fresh isolated browser at the app URL before running each script. `browser-flow.js` uses simulated recognition callbacks with the real UI, audio and API; it checks click/silence/wrong-speech rejection, speech-driven story changes and separate reporting. `browser-mobile.js` verifies drag rejection and unsupported recognition at 390×844. Audio tests use real decoding and media playback. Close each isolated browser after testing.

## Audio

TTS uses OpenRouter `openai/gpt-audio-mini`, voice `nova`. The 19 MP3 clips in `audio/` are generated once, transcript-checked, measured with ffprobe and shipped with the app. Runtime playback does not need a TTS request or browser speech synthesis. The shared audio player starts from a user gesture, exposes playback failures, and waits for feedback to finish before advancing.

`scripts/generate-audio.py` generates missing clips using `OPENROUTER_API_KEY` and ffmpeg. Existing clips are reused. Credentials are never stored in the repository.

Speech input first tries browser SpeechRecognition. If it ends without a result, the same microphone turn is captured as bounded WAV and sent to OpenRouter `openai/gpt-audio-mini` for audio classification. The server accepts only a whitelisted item and never advances on silence or unrelated speech. Clear text item names use local rules; other text utterances can use OpenRouter with a 1.8-second timeout. No transcript is written to disk; server caching is bounded and expires after five minutes. Browser automation simulates recognition and does not establish recognition accuracy for a child's voice.

## Deployment

GitHub Actions publishes `ghcr.io/hoveychen/child-english-speaking-app:latest` on main pushes. The existing Muvee image project listens on port 3000; `/healthz` is its health endpoint.
