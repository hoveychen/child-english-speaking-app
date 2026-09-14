# 小熊英语小屋 v2：OpenRouter 语音优先产品设计

## 0. 目标

面向 5–8 岁、非英语母语、尚不能独立阅读的儿童，把“开口说英语”变成一段可重复的故事体验。核心竞争力不是评分，而是：**每次开口都改变故事、每次失败都有体面的下一步、家长能看见可迁移的语言能力**。

成功指标：首日完成率 ≥70%；单场景主动开口 ≥4 次；语音失败后继续率 ≥85%；一周后在新场景复用目标表达 ≥40%。

## 1. 产品体验

### 儿童循环

```text
看见意图 → 听到自然示范 → 做出选择 → 说一句话 → 角色真正回应 → 故事后果
```

舞台是可探索的绘本，不出现阅读必需的英文文本。每个 6–8 分钟场景包含 4 个 beat：引入、选择、意外、复述。每个 beat 至少有一个“说了才会发生”的后果（篮子装满、雨停、球从藏处滚出）。

### 三层支架

1. **轻提示**：角色眼神、手势、物品高亮。
2. **句首支架**：播放 “We need…” / “I think it is…”；儿童只需补关键词。
3. **示范后回声**：角色分成 2–3 个节奏块，儿童可跟说；随后允许自己的表达替代示范。

任何层级都算成功，不显示红叉、分数或排名。连续沉默 8 秒自动给轻提示，20 秒允许点击继续并记录“需要支架”。

## 2. OpenRouter 语音架构

### 选择原则

OpenRouter 作为统一路由层：模型名、价格和可用性通过服务端配置，不写死在客户端。优先选择支持**音频输入+音频/文本输出**的实时模型；若当前路由没有稳定的 speech-to-speech 模型，采用两阶段：STT → 结构化意图判断 → TTS。模型候选通过 OpenRouter `/models` 能力探测，按 `architecture.input_modalities`、延迟、价格和区域可用性排序。

推荐默认策略：

- **低延迟对话模型**：用于意图、纠错和追问，要求 JSON schema 输出。
- **音频理解模型**：用于儿童录音转写与噪声鲁棒判断。
- **TTS**：优先使用 OpenRouter 暴露的音频输出；不可用时回退浏览器 TTS，核心示范句使用预录音。

### 请求边界

浏览器永不持有 OpenRouter key。`POST /api/turn` 接收短音频（≤12 秒）、scene/beat、候选意图和会话 token；服务端注入儿童安全 system prompt，并将模型输出限制为：`intent`, `confidence_band`, `reply_script`, `next_action`, `support_level`, `safety_flag`。原始音频默认不落盘，转写与教学事件仅保存匿名 session id。

### 延迟与降级

目标：按下麦克风到角色回应 ≤2.5 秒（p50），≤5 秒（p95）。实现流式上传、首 token 即开始动画、TTS 音频分片播放。超时阶梯：1.5 秒先显示“我在听”；3 秒播放预录短回应；5 秒进入点击路径。OpenRouter 429/5xx 时按指数退避一次，随后走本地意图词典；网络断开时仍可完成点击版场景。

### 安全提示词

模型只扮演温柔英语角色，不索取姓名、住址、学校、照片或秘密；不评价口音和身体；遇到成人内容、危险行为或自伤内容时停止故事并提示找可信成人。所有模型输出经过 schema 校验、长度限制和允许短语过滤。

## 3. MVP 场景与内容协议

首发“准备野餐”：选择食物/杯子/毯子，解释 because，按 First/then 复述，遇雨预测 umbrella。后续“穿衣”和“球去哪了”复用同一 beat 协议。

```ts
type TurnResult = {
  intent: string; // take_item | describe_place | explain_reason | retell_order | unknown
  confidence_band: 'clear' | 'partial' | 'uncertain';
  reply_script: string; // <= 18 words
  next_action: 'advance' | 'follow_up' | 'support' | 'fallback';
  support_level: 0 | 1 | 2;
  safety_flag: 'none' | 'adult_needed';
}
```

内容验收：每个 beat 具备目标表达、关键词同义词、中英混说容错、最短点击替代路径、轻/句首/回声三档支架，以及成功后的故事后果。

## 4. 信息架构

儿童端：故事舞台、录音状态、重播、继续、地图贴纸。家长端：本周故事、能力证据、可迁移句子、支架趋势、隐私设置。首次进入只问孩子年龄段和英语接触经验，不要求账户；家长 PIN 解锁报告。

报告不用“准确率”，而用：主动开口次数、完整句次数、位置/原因/顺序能力、独立与支架比例、跨场景迁移。每项展示一条真实片段及下一次家庭小游戏。

## 5. 技术与部署

前端：Vite + React + TypeScript + CSS；服务端：Node/Express（或同栈 serverless）；内容 JSON 与音频资产版本化；localStorage 保存未登录进度。生产环境仅通过环境变量注入 `OPENROUTER_API_KEY`、`OPENROUTER_MODEL_*`、`APP_ORIGIN`。

Muvee 部署契约：监听 `PORT`，健康检查 `GET /healthz` 返回 200；构建命令 `npm ci && npm run build`；启动命令 `npm run start`；静态资源启用 gzip/cache；日志不得包含音频、转写全文或密钥。上线前用 `/healthz`、一次点击场景、一次语音超时降级做 smoke test。

## 6. 质量与实验

建立 20 个匿名脚本回放集：关键词、完整句、口音、背景噪声、中英混说、沉默、拒绝回答。每次模型/提示词变更跑回放，门槛为：危险输出 0；意图误导 ≤5%；支架后继续率不下降。A/B 只测试支架节奏和角色回应，不测试“更严厉评分”。

## 7. 里程碑

P1：点击版野餐场景与设计 token；P2：OpenRouter `/api/turn`、schema 校验和超时降级；P3：真实录音、权限、隐私与回放集；P4：家长报告与迁移任务；P5：Muvee staging smoke test；P6：小规模家庭试用并根据继续率迭代。
