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
