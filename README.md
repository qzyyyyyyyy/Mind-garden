# 心迹花园（Mind Garden）— 心理健康 AI 助手

> 每一次情绪的波动都值得被看见。

一个面向个人情绪记录与改善的**智能陪伴与情绪可视化系统**，采用前后端分离的 Monorepo 架构。系统以「情绪闭环」为核心设计理念，覆盖 **记录 → 洞察 → 调节 → 评估** 完整链路，结合 AI 大模型提供心理咨询、情绪分析与个性化建议。

---

## 一、项目简介

- **项目定位**：心理健康 AI 助手 —— 情绪日志陪伴助手
- **架构模式**：Monorepo（前后端分离）
- **前端端口**：`5173`（开发）
- **后端端口**：`1236`
- **数据库**：MySQL
- **AI 模型**：兼容 OpenAI 协议的大语言模型（默认 SiliconFlow / DeepSeek-V3）

### 情绪闭环设计理念

```
记录 ──→ 洞察 ──→ 调节 ──→ 评估
 │         │         │         │
 情绪日记   情绪周报   情绪急救箱  心理测评
```

用户通过日记记录情绪，系统自动完成情绪分析；周报聚合回顾一周状态；急救箱提供即时调节练习；测评实现风险筛查，形成完整的自我觉察与改善闭环。

---

## 二、仓库结构

```
code/
├── ai-vue/          # 前端（Vue 3 + Vite + Element Plus + ECharts）
│   ├── README.md    # 前端详细文档
│   └── src/         # 用户端前台 + 管理端后台（一套代码双端承载）
├── ai-express/      # 后端（Node.js + Express + Prisma + MySQL）
│   ├── README.md    # 后端详细文档
│   └── src/         # AI 能力 + 业务服务 + 数据访问
└── dors/            # 设计与文档资源（架构图、思维导图、信息框架图）
```

| 子项目                               | 说明                                     | 端口 |
| ------------------------------------ | ---------------------------------------- | ---- |
| [ai-vue](./ai-vue/README.md)         | 前端单页应用，含用户端前台与管理后台     | 5173 |
| [ai-express](./ai-express/README.md) | 后端 RESTful API 服务 + AI 能力          | 1236 |
| dors                                 | 系统模块图、相关信息思维导图、信息框架图 | —    |

---

## 三、核心功能模块

| 模块            | 说明                                                   | 前端页面                                                        | 后端路由前缀          |
| --------------- | ------------------------------------------------------ | --------------------------------------------------------------- | --------------------- |
| 🤖 AI 心理咨询  | SSE 流式对话、会话管理、对话后自动情绪分析（情绪花园） | `consultation.vue`                                              | `/psychological-chat` |
| 📔 情绪日记     | 心情评分、8 种情绪可视化、睡眠/压力多维记录 + AI 分析  | `emotionDiary.vue`                                              | `/emotion-diary`      |
| 📊 情绪周报     | 一键生成周度情绪报告，历史周报回顾                     | `weeklyReport.vue`                                              | `/weekly-report`      |
| 🧰 情绪急救箱   | 情绪自检 → 智能推荐练习 → 打卡记录 → 效果统计          | `firstAidKit.vue`                                               | `/exercise`           |
| 📋 心理测评     | 标准化量表在线测评、结果分级解读、历史记录             | `assessment.vue`                                                | `/assessment`         |
| 📚 知识库       | 分类浏览、搜索、详情阅读（前台）；文章 CRUD（后台）    | `frontendKnowledge.vue` / `articleDetail.vue` / `knowledge.vue` | `/knowledge`          |
| 📈 数据分析后台 | ECharts 多维图表 + 统计卡片，支撑运营决策              | `dashboard.vue`                                                 | `/data-analytics`     |

### 管理后台功能

| 模块           | 说明                                       |
| -------------- | ------------------------------------------ |
| 数据分析仪表盘 | 用户统计、情绪趋势、咨询统计、用户活跃度   |
| 知识文章管理   | 文章 CRUD、发布/下线、封面上传、富文本编辑 |
| 咨询记录管理   | 会话列表、消息详情查看                     |
| 情绪日志管理   | 用户日记列表、删除                         |

---

## 四、技术栈总览

### 前端（ai-vue）

| 类别    | 技术选型                                    | 版本    |
| ------- | ------------------------------------------- | ------- |
| 框架    | Vue 3（Composition API + `<script setup>`） | ^3.5.39 |
| 构建    | Vite                                        | ^8.1.1  |
| 路由    | Vue Router（History 模式 + 权限守卫）       | ^4.6.4  |
| 状态    | Pinia                                       | ^3.0.4  |
| UI 组件 | Element Plus                                | ^2.14.3 |
| HTTP    | Axios                                       | ^1.18.1 |
| SSE     | @microsoft/fetch-event-source               | ^2.0.1  |
| 图表    | ECharts                                     | ^6.1.0  |
| 富文本  | wangEditor                                  | ^5.1.x  |
| 样式    | Sass                                        | ^1.97.2 |

### 后端（ai-express）

| 类别       | 技术选型                  | 版本         |
| ---------- | ------------------------- | ------------ |
| 运行时     | Node.js（ES Modules）     | ≥ 18         |
| Web 框架   | Express                   | ^4.19.2      |
| ORM        | Prisma / @prisma/client   | ^5.22.0      |
| 数据库     | MySQL                     | ≥ 5.7        |
| 鉴权       | jsonwebtoken              | ^9.0.2       |
| 密码加密   | bcryptjs                  | ^2.4.3       |
| 文件上传   | multer                    | ^1.4.5-lts.1 |
| LLM 客户端 | openai（OpenAI 兼容协议） | ^4.65.0      |
| 日志       | morgan                    | ^1.10.0      |
| 环境变量   | dotenv                    | ^16.4.5      |

### 数据库模型（9 张表）

| 模型                  | 表名                   | 说明                                                   |
| --------------------- | ---------------------- | ------------------------------------------------------ |
| `User`                | `user`                 | 用户表（普通用户 `user_type=1`，管理员 `user_type=2`） |
| `ConsultationSession` | `consultation_session` | 咨询会话（含最近一次情绪分析 JSON）                    |
| `ConsultationMessage` | `consultation_message` | 会话消息（用户/AI 消息）                               |
| `EmotionDiary`        | `emotion_diary`        | 情绪日记（每用户每日唯一）                             |
| `AiAnalysisTask`      | `ai_analysis_task`     | AI 分析任务记录                                        |
| `KnowledgeCategory`   | `knowledge_category`   | 知识分类（支持父子层级）                               |
| `KnowledgeArticle`    | `knowledge_article`    | 知识文章（UUID 主键）                                  |
| `SysFileInfo`         | `sys_file_info`        | 上传文件元信息                                         |
| `UserFavorite`        | `user_favorite`        | 用户收藏                                               |

---

## 五、快速开始

### 5.1 环境准备

- **Node.js** ≥ 18（建议 20+）
- **MySQL** ≥ 5.7（数据库需已存在，含数据表）
- **LLM API Key**：兼容 OpenAI 协议的大模型服务密钥（用于 AI 对话与情绪分析）

### 5.2 启动后端

```bash
cd ai-express

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填写 DB_PASSWORD、JWT_SECRET、LLM_API_KEY 等

# 生成 Prisma Client（仅生成客户端，不执行 migrate / db push）
npx prisma generate

# 开发模式（热重载）
npm run dev
```

启动成功后访问：`http://localhost:1236/api/test` → `{"code":"200","msg":"操作成功","data":"hello world"}`

### 5.3 启动前端

```bash
cd ai-vue

# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev
```

开发代理已配置：`/api` 和 `/files` 均转发至 `http://localhost:1236`，无需额外配置跨域。

### 5.4 一键启动（可选）

在两个终端分别执行：

```bash
# 终端 1
cd ai-express && npm run dev

# 终端 2
cd ai-vue && npm run dev
```

---

## 六、环境变量（后端）

复制 `ai-express/.env.example` 为 `ai-express/.env`：

| 变量             | 默认值                          | 说明                                         |
| ---------------- | ------------------------------- | -------------------------------------------- |
| `PORT`           | `1236`                          | 服务监听端口                                 |
| `DB_HOST`        | `localhost`                     | MySQL 主机                                   |
| `DB_PORT`        | `3306`                          | MySQL 端口                                   |
| `DB_USER`        | `root`                          | MySQL 用户名                                 |
| `DB_PASSWORD`    | （空）                          | MySQL 密码                                   |
| `DB_NAME`        | `mental_health_assistant`       | 数据库名                                     |
| `JWT_SECRET`     | 内置默认值                      | JWT 签名密钥（生产环境务必修改）             |
| `JWT_EXPIRATION` | `86400000`                      | Token 过期时间（毫秒，默认 24h）             |
| `JWT_ISSUER`     | `mental-health-assistant`       | JWT 签发者                                   |
| `LLM_BASE_URL`   | `https://api.siliconflow.cn/v1` | LLM API 地址（OpenAI 兼容）                  |
| `LLM_API_KEY`    | `you-key`                       | LLM API 密钥（**必填**，否则 AI 功能不可用） |
| `LLM_MODEL`      | `deepseek-ai/DeepSeek-V3`       | 模型名称                                     |
| `UPLOAD_DIR`     | `public`                        | 上传文件存储目录                             |

---

## 七、权限体系

### 认证机制

- **Token 传递**：请求头 `token: <JWT>`
- **签发**：登录成功后由 `jwt.sign` 生成，claims 含 `userId` / `username` / `roleType`，默认 24h 过期
- **前端存储**：`localStorage` 中存储 `token` 和 `userInfo`
- **前端守卫**：`router.beforeEach` 基于 `token` 与 `userInfo.userType` 控制页面访问

### 角色区分

| 角色     | `user_type` | 可访问                             |
| -------- | ----------- | ---------------------------------- |
| 普通用户 | `1`         | 用户端前台全部页面                 |
| 管理员   | `2`         | 用户端前台 + 管理后台（`/back/*`） |

### 错误码

| 错误码  | 说明                      |
| ------- | ------------------------- |
| `A0301` | 未携带 token / 访问未授权 |
| `A0230` | token 无效或过期          |

---

## 八、项目亮点

1. **情绪闭环设计**：日记记录 → 周报回顾 → 急救练习 → 测评筛查，覆盖完整情绪管理链路
2. **双端一体架构**：一套 Vue 代码承载前台与管理后台，路由守卫 + userType 无缝切换
3. **SSE 流式对话**：AI 对话流式输出，打字机效果，体验流畅
4. **情绪花园**：实时情绪分析 + 风险分级（正常/关注/预警/危机）+ 治愈建议与小行动
5. **数据可视化**：ECharts 多维图表（情绪趋势、咨询统计、用户活跃度）支撑后台运营
6. **组件化程度高**：TableSearch、ArticleDialog、PageHead、RichTextEditor 等可复用组件
7. **温暖治愈 UI**：前台粉色渐变主色调、玻璃拟态、呼吸动画，契合心理健康产品定位
8. **LLM 容错设计**：情绪分析 JSON 输出多级解析容错，不影响主流程

---

## 九、目录结构详解

### 前端（ai-vue/src）

```
src/
├── api/                 # 接口层
│   ├── admin.js         # 管理后台 API（15 个）
│   └── frontend.js      # 用户端 API（21 个）
├── components/          # 公共组件（布局、富文本、Markdown 渲染等）
├── config/index.js      # 全局配置（fileBaseUrl 文件服务地址）
├── router/index.js      # 路由配置 + 权限守卫
├── stores/admin.js      # Pinia 状态
├── utils/request.js     # Axios 封装（拦截器、错误处理）
└── views/               # 页面视图
    ├── home.vue                  # 【前台】首页
    ├── consultation.vue          # 【前台】AI 心理咨询
    ├── emotionDiary.vue          # 【前台】情绪日记
    ├── weeklyReport.vue          # 【前台】情绪周报
    ├── firstAidKit.vue           # 【前台】情绪急救箱
    ├── assessment.vue            # 【前台】心理测评
    ├── frontendKnowledge.vue     # 【前台】知识库列表
    ├── articleDetail.vue         # 【前台】文章详情
    ├── login.vue / register.vue  # 【认证】登录/注册
    ├── dashboard.vue             # 【后台】数据分析
    ├── knowledge.vue             # 【后台】知识文章管理
    ├── consultations.vue         # 【后台】咨询记录
    └── emotional.vue             # 【后台】情绪日志
```

### 后端（ai-express/src）

```
src/
├── ai/                  # AI 能力层（对话内存、LLM 客户端、提示词）
├── common/              # 统一响应体 Result、全局异常处理
├── config/              # Prisma 客户端 + 原始 SQL 工具、环境变量
├── dao/                 # 数据访问层（Prisma + 原始 SQL）
├── exceptions/          # 业务异常
├── middleware/          # JWT 鉴权、管理员校验、路径匹配
├── routes/              # 路由层（统一 /api 前缀）
├── services/            # 业务逻辑层（chat/diary/emotion/exercise/report/assessment 等）
├── utils/jwt.js         # JWT 签发/校验/提取
└── server.js            # 应用入口
```

---

## 十、注意事项

1. **不要执行 `prisma migrate` 或 `db push`**：数据库已存在，仅使用 `npx prisma generate` 生成客户端。
2. **`LLM_API_KEY` 必须配置**：否则心理咨询、情绪分析等 AI 功能不可用（接口会返回友好错误而非崩溃）。
3. **生产环境务必修改 `JWT_SECRET`**：使用强随机密钥。
4. **上传目录 `public/` 已加入 `.gitignore`**：部署时需确保目录存在且有写入权限。
5. **前端 `fileBaseUrl` 配置**：位于 `ai-vue/src/config/index.js`，当前为空串走同域 + 代理；若文件服务独立部署，在此修改为文件服务器地址。
6. **BigInt 序列化**：Prisma 读取的 `bigint` 在 JSON 响应中需转为 `Number`，已在 dao 层处理。

---

## 十一、子项目文档

- 📘 [前端详细文档](./ai-vue/README.md) — 路由体系、组件说明、API 分层、UI 设计
- 📗 [后端详细文档](./ai-express/README.md) — 分层架构、数据表、API 接口文档、关键设计说明
- 📐 [系统模块图](./dors/system-module-diagram.html)
- 🧠 [相关信息思维导图](./dors/related-info-mindmap.html)
- 🗂️ [信息框架图](./dors/信息框架图.html)

---

## 十二、免责声明

本系统中的心理测评、情绪分析与 AI 建议**仅用于自我觉察与情绪陪伴**，不构成医学诊断或专业心理治疗建议。如您正经历严重的心理困扰，请及时寻求专业心理咨询师或精神科医生的帮助。
