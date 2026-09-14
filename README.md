# Child English Speaking MVP

小熊英语小屋：面向 5–8 岁儿童的故事化英语口语练习。当前 MVP 是“准备野餐”场景，支持点击物品、浏览器语音输入、语音回应与 OpenRouter 兼容的 `/api/turn` 接口。

## Run

```bash
npm install
npm start
```

Open `http://localhost:3000`. The server listens on `PORT` (default `3000`) and exposes `GET /healthz`.

## Container

```bash
docker build -t child-english .
docker run --rm -p 3000:3000 child-english
```

Every push to `main` builds and publishes `ghcr.io/<owner>/<repo>:latest` through GitHub Actions. The image does not bake in API keys; configure future OpenRouter secrets as runtime environment variables.

## Visual picnic redesign

Run `npm ci`, `npm start`, then open http://localhost:3000. `npm test` checks stage-aware speech decisions, cache isolation, negation, request validation, and private-file routing. `npm run build` exports the three browser assets to `dist/`.

The child selects then places an object (or drags it): apple into basket, blanket onto grass, umbrella over the bear. The final activity recalls the three pictures in order. Speaker and hand buttons replay voice and visual demonstrations. All activities work without speech recognition; picture-only completion is never counted as speaking practice.

Speech currently uses the browser's SpeechRecognition service, sending its transcript to `/api/turn`. Clear item names use local rules; other utterances can use OpenRouter with a 1.8-second timeout. This is **not a direct audio-model integration**. Missing microphone support, recognition errors, and API failures retain the picture interaction path. No transcript is written to disk; the bounded in-memory cache expires after five minutes.

Browser QA scripts in `tests/browser-*.js` are functions for `patchwright-cli run-code`. Start a separate named browser, open the local server, and start the picnic before running `browser-flow.js`; run mobile QA at 390×844. Voice QA injects **simulated** recognition results and does not verify a real microphone or OpenRouter model quality. Close the isolated browser after testing.
