# 心迹花园 - 后端服务 (ai-express)

心理健康 AI 助手后端服务，基于 **Node.js + Express + Prisma** 构建，提供 AI 心理咨询、情绪日记、心理健康知识库、数据统计分析等核心能力。

---

## 一、项目简介

- **项目名称**：ai-express
- **项目定位**：心理健康 AI 助手后端
- **技术架构**：前后端分离
- **默认端口**：`1236`
- **数据库**：MySQL（通过 Prisma ORM 访问）
- **AI 模型**：兼容 OpenAI 协议的大语言模型（默认 SiliconFlow / DeepSeek-V3）

### 核心功能

| 模块 | 说明 |
|------|------|
| 用户认证 | 注册 / 登录 / 登出 / 当前用户信息，JWT 鉴权，角色区分（普通用户 / 管理员） |
| AI 心理咨询 | SSE 流式对话、会话管理、历史消息、对话记忆 |
| 情绪分析 | 基于 LLM 的结构化情绪分析，支持会话情绪 & 日记情绪，风险分级 |
| 情绪日记 | 日记记录（UPSERT）、AI 情绪分析自动落库、分析任务记录 |
| 知识库 | 分类树、文章分页搜索、文章详情、阅读量自增、管理员 CRUD |
| 文件上传 | 基于 multer 的文件上传，支持封面图等业务附件 |
| 数据统计 | 系统概览、咨询统计、情绪趋势、用户活跃度（管理员） |

---

## 二、技术栈

| 类别 | 技术选型 | 版本 | 说明 |
|------|----------|------|------|
| 运行时 | Node.js | - | 要求支持 ES Modules (`"type": "module"`) |
| Web 框架 | Express | ^4.19.2 | HTTP 服务与路由 |
| ORM | Prisma / @prisma/client | ^5.22.0 |
| 数据库 | MySQL | - | 业务数据存储 |
| 鉴权 | jsonwebtoken | ^9.0.2 | JWT 签发与校验 |
| 密码加密 | bcryptjs | ^2.4.3 | 密码哈希存储与校验 |
| 跨域 | cors | ^2.8.5 | CORS 中间件 |
| 日志 | morgan | ^1.10.0 | HTTP 请求日志 |
| 文件上传 | multer | ^1.4.5-lts.1 | multipart/form-data 解析 |
| LLM 客户端 | openai | ^4.65.0 | OpenAI 兼容协议调用 |
| 环境变量 | dotenv | ^16.4.5 | .env 配置加载 |

---

## 三、项目结构

```
ai-express/
├── prisma/
│   └── schema.prisma              # Prisma 数据模型（8 张表）
├── src/
│   ├── ai/                        # AI 能力层
│   │   ├── chatMemory.js          # 对话内存管理（按会话隔离）
│   │   ├── llmClient.js           # LLM 客户端（流式/非流式 + JSON 解析容错）
│   │   └── prompts.js             # 系统提示词（心理咨询 / 情绪分析）
│   ├── common/
│   │   ├── result.js              # 统一响应体 Result + ResultCode
│   │   └── errorHandler.js        # 404 / 全局异常处理
│   ├── config/
│   │   ├── database.js            # Prisma 客户端 + 原始 SQL 工具
│   │   └── env.js                 # 环境变量 + 公开路径白名单
│   ├── dao/                       # 数据访问层（Prisma + 原始 SQL）
│   │   ├── analyticsDao.js
│   │   ├── articleDao.js
│   │   ├── categoryDao.js
│   │   ├── diaryDao.js
│   │   ├── messageDao.js
│   │   ├── sessionDao.js
│   │   └── userDao.js
│   ├── exceptions/
│   │   └── businessException.js   # 业务异常
│   ├── middleware/
│   │   ├── auth.js                # JWT 鉴权中间件 + 管理员校验
│   │   └── pathMatcher.js         # 路径匹配工具
│   ├── routes/                    # 路由层（统一挂 /api 前缀）
│   │   ├── userRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── diaryRoutes.js
│   │   ├── knowledgeRoutes.js
│   │   ├── fileRoutes.js
│   │   └── analyticsRoutes.js
│   ├── services/                  # 业务逻辑层
│   │   ├── chatService.js         # 心理咨询（会话 + SSE 流式）
│   │   ├── diaryService.js        # 情绪日记 + AI 分析
│   │   ├── emotionService.js      # 会话情绪分析
│   │   ├── fileService.js         # 文件上传处理
│   │   ├── userService.js         # 登录/注册/当前用户
│   │   └── convert/
│   │       └── userConvert.js     # 用户实体转 DTO
│   ├── utils/
│   │   └── jwt.js                 # JWT 签发/校验/提取
│   └── server.js                  # 应用入口
├── .env                           # 环境变量（不入库）
├── .env.example                   # 环境变量模板
├── .gitignore
├── package.json
└── package-lock.json
```

### 分层说明

- **routes**：仅做参数透传与 `try/catch`，调用 service 或 dao，返回 `Result.ok(...)`
- **services**：业务编排，调用多个 dao，处理事务性逻辑
- **dao**：纯数据访问，使用 Prisma 查询构建器；复杂聚合用 `$queryRawUnsafe` 原始 SQL
- **ai**：与大模型交互的封装，独立于业务层

---

## 四、环境准备

### 4.1 前置依赖

- **Node.js** ≥ 18（建议 20+）
- **MySQL** ≥ 5.7（数据库需已存在，含数据表）
- **LLM API Key**：兼容 OpenAI 协议的大模型服务密钥

### 4.2 安装依赖

```bash
cd ai-express
npm install
```

### 4.3 环境变量配置

复制 `.env.example` 为 `.env` 并填写：

```bash
cp .env.example .env
```

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `1236` | 服务监听端口 |
| `DB_HOST` | `localhost` | MySQL 主机 |
| `DB_PORT` | `3306` | MySQL 端口 |
| `DB_USER` | `root` | MySQL 用户名 |
| `DB_PASSWORD` | （空） | MySQL 密码 |
| `DB_NAME` | `mental_health_assistant` | 数据库名 |
| `JWT_SECRET` | 内置默认值 | JWT 签名密钥（生产环境务必修改） |
| `JWT_EXPIRATION` | `86400000` | Token 过期时间（毫秒，默认 24h） |
| `JWT_ISSUER` | `mental-health-assistant` | JWT 签发者 |
| `LLM_BASE_URL` | `https://api.siliconflow.cn/v1` | LLM API 地址（OpenAI 兼容） |
| `LLM_API_KEY` | `you-key` | LLM API 密钥（**必填**，否则 AI 功能不可用） |
| `LLM_MODEL` | `deepseek-ai/DeepSeek-V3` | 模型名称 |
| `UPLOAD_DIR` | `public` | 上传文件存储目录（项目根目录下） |

> ⚠️ 启动时控制台会提示 LLM API Key 是否已配置。若为 `you-key` 则 AI 相关接口会返回友好错误而非崩溃。

---

## 五、数据库配置

### 5.1 Prisma Client 生成

数据库表已存在，**仅生成客户端，不执行 migrate / db push**：

```bash
npx prisma generate
```

### 5.2 数据表概览（`prisma/schema.prisma`）

| 模型 | 表名 | 说明 |
|------|------|------|
| `User` | `user` | 用户表（普通用户 user_type=1，管理员 user_type=2） |
| `ConsultationSession` | `consultation_session` | 咨询会话（含最近一次情绪分析 JSON） |
| `ConsultationMessage` | `consultation_message` | 会话消息（用户/AI 消息） |
| `EmotionDiary` | `emotion_diary` | 情绪日记（每用户每日唯一 `user_date_unique`） |
| `AiAnalysisTask` | `ai_analysis_task` | AI 分析任务记录 |
| `KnowledgeCategory` | `knowledge_category` | 知识分类（支持父子层级） |
| `KnowledgeArticle` | `knowledge_article` | 知识文章（UUID 主键） |
| `SysFileInfo` | `sys_file_info` | 上传文件元信息 |
| `UserFavorite` | `user_favorite` | 用户收藏（联合唯一） |

> 字段命名采用 camelCase，通过 `@map` 对齐数据库 snake_case 列名；`bigint` 列声明为 `BigInt`，在 dao 层按需 `Number()` 转换。

---

## 六、启动项目

### 开发模式（热重载）

```bash
npm run dev
```

### 生产模式

```bash
npm start
```

启动成功后控制台输出：

```
[ai-express] listening on http://localhost:1236
[ai-express] MySQL: localhost:3306/mental_health_assistant
[ai-express] LLM: https://api.siliconflow.cn/v1 | model=deepseek-ai/DeepSeek-V3 | apiKey=已配置
```

测试接口：`GET http://localhost:1236/api/test` → `{"code":"200","msg":"操作成功","data":"hello world"}`

---

## 七、API 接口文档

所有接口统一前缀 `/api`，统一响应体：

```json
{
  "code": "200",
  "msg": "操作成功",
  "data": {}
}
```

### 7.1 用户模块

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/test` | 公开 | 健康检查 |
| POST | `/user/login` | 公开 | 登录（用户名/邮箱 + 密码），返回 token |
| POST | `/user/add` | 公开 | 注册（默认普通用户） |
| GET | `/user/current` | 需登录 | 获取当前用户信息 |
| POST | `/user/logout` | 需登录 | 登出 |

**登录请求体**：`{ "username": "xxx", "password": "xxx" }`
**登录响应 data**：`{ "token": "...", "roleType": "1", "userInfo": {...} }`

### 7.2 AI 心理咨询模块

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/psychological-chat/session/start` | 需登录 | 开始新会话 |
| POST | `/psychological-chat/stream` | 需登录 | SSE 流式对话 |
| GET | `/psychological-chat/sessions` | 需登录 | 会话分页列表（管理员看全部） |
| DELETE | `/psychological-chat/sessions/:id` | 需登录 | 删除会话 |
| GET | `/psychological-chat/sessions/:id/messages` | 需登录 | 获取会话消息列表 |
| GET | `/psychological-chat/session/:sessionId/emotion` | 需登录 | 会话情绪分析（LLM） |

**SSE 流式对话**：Content-Type `text/event-stream`，事件类型：
- `message`：AI 回复内容增量 `{ code, msg, data: { content, type } }`
- `done`：对话结束
- `error`：错误 `{ code, msg, data }`

**情绪分析返回字段**：`primaryEmotion`、`emotionScore(0-100)`、`isNegative`、`riskLevel(0-3)`、`suggestion`、`improvementSuggestions[]`、`riskDescription`、`icon`、`label`、`keywords[]`、`timestamp`

### 7.3 情绪日记模块

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/emotion-diary` | 需登录 | 保存日记（同用户同日期 UPSERT）+ AI 情绪分析 |
| GET | `/emotion-diary/admin/page` | 管理员 | 日记分页列表 |
| DELETE | `/emotion-diary/admin/:id` | 管理员 | 删除日记 |

**日记字段**：`diaryDate`、`moodScore(1-10)`、`dominantEmotion`、`emotionTriggers`、`diaryContent`、`sleepQuality(1-5)`、`stressLevel(1-5)`

### 7.4 知识库模块

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/knowledge/category/tree` | 需登录 | 分类树 |
| GET | `/knowledge/article/page` | 需登录 | 文章分页（支持 categoryId/keyword/status 筛选） |
| GET | `/knowledge/article/:id` | 需登录 | 文章详情（阅读量 +1） |
| POST | `/knowledge/article` | 管理员 | 新增文章 |
| PUT | `/knowledge/article/:id` | 管理员 | 编辑文章 |
| PUT | `/knowledge/article/:id/status` | 管理员 | 上下线状态切换 |
| DELETE | `/knowledge/article/:id` | 管理员 | 删除文章 |

### 7.5 文件上传模块

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/file/upload` | 需登录 | 上传文件（FormData，字段名 `file`，最大 20MB） |

可选参数：`businessType`（默认 `ARTICLE`）、`businessId`、`businessField`
上传文件通过 `/files/xxx` 静态路径访问。

### 7.6 数据统计模块

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/data-analytics/overview` | 管理员 | 系统概览 + 咨询统计 + 情绪趋势 + 用户活跃度 |

---

## 八、鉴权机制

- **Token 传递**：请求头 `token: <JWT>`
- **签发**：登录成功后由 `jwt.sign` 生成，claims 含 `userId` / `username` / `roleType`，默认 24h 过期
- **校验**：`authMiddleware` 中间件统一拦截，公开路径（`/`、`/api/test`、`/api/user/login`、`/api/user/add`）放行
- **管理员校验**：`requireAdmin` 中间件校验 `roleType === 2`
- **错误码**：
  - `A0301`：未携带 token / 访问未授权
  - `A0230`：token 无效或过期

---

## 九、关键设计说明

### 9.1 AI 对话记忆

每个会话对应一个 `conversation_<sessionId>` 的内存对话上下文，system prompt + 历史消息一并发送给 LLM，保证多轮对话连贯性。

### 9.2 情绪分析容错

LLM 输出可能不严格符合 JSON，`parseJsonResponse` 会依次尝试：直接解析 → 剥离 ` ```json ` 围栏 → 截取首个 `{...}`。全部失败时返回默认兜底结果，不影响主流程。

### 9.3 阅读量自增

文章详情阅读量使用原始 SQL `UPDATE ... SET read_count = read_count + 1`，绕过 Prisma 的 `@updatedAt`，确保阅读量增加不触发 `updated_at` 变更。

### 9.4 联合唯一约束

`emotion_diary` 的 `(user_id, diary_date)` 使用自定义约束名 `user_date_unique`，Prisma 查询时必须使用该名称而非默认名。

### 9.5 文件上传流程

multer 先写入系统临时目录 `os.tmpdir()/ai-express-uploads`，再由 `fileService` 复制到 `UPLOAD_DIR` 并在 `sys_file_info` 表记录元信息。

---

## 十、脚本命令

```json
{
  "start": "node src/server.js",
  "dev": "node --watch src/server.js"
}
```

额外命令：

```bash
npx prisma generate   # 生成 Prisma Client（修改 schema 后执行）
npx prisma studio     # 可视化查看数据库（可选）
```

---

## 十一、注意事项

1. **不要执行 `prisma migrate` 或 `db push`**：数据库已存在，仅使用 `prisma generate` 生成客户端。
2. **LLM_API_KEY 必须配置**：否则心理咨询、情绪分析等 AI 功能不可用。
3. **生产环境务必修改 `JWT_SECRET`**：使用强随机密钥。
4. **上传目录 `public/` 已加入 `.gitignore`**：部署时需确保目录存在且有写入权限。
5. **BigInt 序列化**：Prisma 读取的 `bigint` 在 JSON 响应中需转为 `Number`，已在 dao 层处理。

---

## 十二、前端项目

配套前端项目位于同级目录 `../ai-vue`（Vue 3 + Vite + Element Plus + ECharts），包含用户端前台与管理端后台。前端开发代理默认指向后端 `http://localhost:1236`（或部署地址）。
