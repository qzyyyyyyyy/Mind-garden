# 心迹花园（ai-vue）— 前端项目

基于 Vue 3 构建的**情绪日志陪伴助手**前端应用，采用前后端分离架构，为用户提供 AI 心理咨询、情绪日记、情绪周报、情绪急救箱、心理测评、心理健康知识库等服务。一套代码同时承载面向普通用户的**用户端前台**和面向管理员的**管理后台**。

- **项目名称**：ai-vue
- **项目定位**：心迹花园 —— 面向个人情绪记录与改善的智能陪伴与情绪可视化系统
- **开发模式**：前后端分离（后端见 `ai-express`）

---

## 一、功能特性

- 🤖 **AI 心理咨询**：SSE 流式对话、会话管理、对话后自动情绪分析（情绪花园）
- 📔 **情绪日记**：心情评分、8 种情绪可视化选择、睡眠/压力多维记录
- 📊 **情绪周报**：一键生成周度情绪报告，历史周报回顾（心情/睡眠均值等统计）
- 🧰 **情绪急救箱**：情绪自检 → 智能推荐练习 → 打卡记录 → 效果统计
- 📋 **心理测评**：标准化量表在线测评、结果分级解读、历史记录
- 📚 **知识库**：文章分类浏览、搜索、详情阅读（前台）；文章 CRUD、发布/下线（后台）
- 📈 **数据分析后台**：ECharts 多维图表 + 统计卡片，支撑运营决策

---

## 二、技术栈

### 2.1 核心框架与工具

| 类别 | 技术选型 | 版本 | 说明 |
|------|----------|------|------|
| 前端框架 | Vue | ^3.5.39 | Composition API + `<script setup>` 语法 |
| 构建工具 | Vite | ^8.1.1 | 支持 HMR、路径别名、开发代理 |
| 路由管理 | Vue Router | ^4.6.4 | History 模式 + 前置守卫权限控制 |
| 状态管理 | Pinia | ^3.0.4 | 轻量级状态库 |
| UI 组件库 | Element Plus | ^2.14.3 | 企业级 Vue 3 组件库 |
| 图标库 | @element-plus/icons-vue | ^2.3.2 | Element Plus 官方图标集 |

### 2.2 功能依赖

| 类别 | 技术选型 | 版本 | 说明 |
|------|----------|------|------|
| HTTP 客户端 | Axios | ^1.18.1 | 请求/响应拦截器，统一处理 Token 和错误 |
| 流式请求 | @microsoft/fetch-event-source | ^2.0.1 | 处理 SSE 流式 AI 对话 |
| 图表库 | ECharts | ^6.1.0 | 仪表盘数据可视化 |
| 富文本编辑器 | @wangeditor/editor（+ for-vue） | ^5.1.x | 知识文章编辑 |
| CSS 预处理器 | Sass | ^1.97.2 | SCSS 语法 |

### 2.3 开发配置（vite.config.js）

```javascript
{
  alias: { "@": resolve(__dirname, "src") },
  server: {
    proxy: {
      '/api':   { target: 'http://localhost:1236', changeOrigin: true },  // 业务接口
      '/files': { target: 'http://localhost:1236', changeOrigin: true }   // 静态文件（图片等）
    }
  }
}
```

> 文件访问前缀由 `src/config/index.js` 的 `fileBaseUrl` 统一配置（当前为空串，走同域 + 代理；文件服务独立部署时在此修改）。

---

## 三、快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 生产环境打包
npm run build

# 本地预览构建产物
npm run preview
```

> 前置条件：本地 1236 端口需运行后端服务（ai-express），否则接口与文件请求将失败。

---

## 四、项目目录结构

```
ai-vue/
├── public/                          # 静态资源
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/                         # 接口层（按用户角色划分）
│   │   ├── admin.js                 # 管理后台 API（15 个）
│   │   └── frontend.js              # 用户端 API（21 个）
│   ├── assets/
│   │   └── images/                  # 情绪图标、机器人头像、book.png 等
│   ├── components/                  # 公共组件
│   │   ├── ArticleDialog.vue        # 文章新增/编辑弹窗
│   │   ├── AuthLayout.vue           # 认证页布局（登录/注册）
│   │   ├── BackendLayout.vue        # 后台布局（侧边栏+顶部导航）
│   │   ├── FrontendLayout.vue       # 前台布局（导航栏+页脚）
│   │   ├── MarkdownRenderer.vue     # Markdown 渲染器（AI 回复渲染）
│   │   ├── Navbar.vue               # 后台顶部导航
│   │   ├── PageHead.vue             # 页面头部组件
│   │   ├── RichTextEditor.vue       # 富文本编辑器封装（wangEditor）
│   │   ├── Sidebar.vue              # 后台侧边栏导航
│   │   └── TableSearch.vue          # 表格搜索组件（动态表单）
│   ├── config/
│   │   └── index.js                 # 全局配置（fileBaseUrl 文件服务地址）
│   ├── router/
│   │   └── index.js                 # 路由配置 + 权限守卫
│   ├── stores/
│   │   └── admin.js                 # Pinia 状态（侧边栏折叠状态）
│   ├── utils/
│   │   └── request.js               # Axios 封装（拦截器、错误处理）
│   ├── views/                       # 页面视图
│   │   ├── home.vue                 # 【前台】首页
│   │   ├── consultation.vue         # 【前台】AI 心理咨询（核心页面）
│   │   ├── emotionDiary.vue         # 【前台】情绪日记
│   │   ├── weeklyReport.vue         # 【前台】情绪周报 ★新增
│   │   ├── firstAidKit.vue          # 【前台】情绪急救箱 ★新增
│   │   ├── assessment.vue           # 【前台】心理测评 ★新增
│   │   ├── frontendKnowledge.vue    # 【前台】知识库列表
│   │   ├── articleDetail.vue        # 【前台】文章详情页
│   │   ├── login.vue                # 【认证】登录页
│   │   ├── register.vue             # 【认证】注册页
│   │   ├── dashboard.vue            # 【后台】数据分析仪表盘
│   │   ├── knowledge.vue            # 【后台】知识文章管理
│   │   ├── consultations.vue        # 【后台】咨询记录管理
│   │   └── emotional.vue            # 【后台】用户情绪日志管理
│   ├── App.vue
│   ├── main.js                      # 入口文件（注册全局组件）
│   └── style.css                    # 全局样式
├── index.html
├── vite.config.js
└── package.json
```

---

## 五、路由与权限体系

### 5.1 路由总览

| 布局 | 路径前缀 | 适用角色 | 子路由数 |
|------|----------|----------|----------|
| FrontendLayout | `/` | 所有用户（游客/普通用户） | 8 |
| BackendLayout | `/back` | 管理员（userType=2） | 4 |
| AuthLayout | `/auth` | 游客（未登录用户） | 2 |

### 5.2 前台路由（用户端）

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 公开 |
| `/consultation` | AI 心理咨询 | 需登录 |
| `/emotionDiary` | 情绪日记 | 需登录 |
| `/weeklyReport` | 情绪周报 ★ | 需登录 |
| `/firstAidKit` | 情绪急救箱 ★ | 需登录 |
| `/assessment` | 心理测评 ★ | 需登录 |
| `/knowledge` | 知识库列表 | 公开 |
| `/knowledge/article/:id` | 文章详情 | 公开 |

### 5.3 后台路由（管理端）

| 路径 | 页面 |
|------|------|
| `/back/dashboard` | 数据分析 |
| `/back/knowledge` | 知识文章管理 |
| `/back/consultations` | 咨询记录 |
| `/back/emotional` | 情绪日志管理 |

### 5.4 认证路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/auth/login` | 登录 | 管理员/普通用户统一登录 |
| `/auth/register` | 注册 | 默认注册为普通用户 |

### 5.5 权限守卫逻辑（router.beforeEach）

基于 `localStorage` 中的 `token` 和 `userInfo.userType` 判断：

```
有 Token?
├─ YES → userType=2(管理员)?
│        ├─ YES → 访问 /back/* 放行，否则重定向 /back/dashboard
│        └─ NO  → 普通用户：访问 /back 或 /auth 一律重定向首页，其余放行
└─ NO  → 访问 /back 则跳转 /auth/login，其他页面放行
```

---

## 六、核心功能模块

### 6.1 AI 心理咨询（consultation.vue）

1. **SSE 流式对话**：`@microsoft/fetch-event-source` 调用 `POST /api/psychological-chat/stream`，支持打字机效果、"AI 正在输入"指示、异常处理
2. **会话管理**：新建/切换/删除会话；临时会话（TEMP）机制，首次发消息才创建正式会话
3. **情绪花园**：对话结束自动调用 `getSessionEmotion`，展示情绪名称/分数、正负判断、风险等级（正常/关注/预警/危机）、温暖建议与治愈小行动、高风险提示卡
4. **Markdown 渲染**：自定义 `MarkdownRenderer` 渲染 AI 回复

### 6.2 情绪日记（emotionDiary.vue）

| 字段 | 类型 | 说明 |
|------|------|------|
| diaryDate | date | 记录日期（默认当天） |
| moodScore | number | 情绪评分 1-10（10 级文案描述） |
| dominantEmotion | string | 8 种情绪图标选择（开心/平静/焦虑/悲伤/兴奋/疲惫/惊讶/困惑） |
| emotionTriggers | string | 情绪触发因素（≤1000 字） |
| diaryContent | string | 今日感想（≤2000 字） |
| sleepQuality | number | 睡眠质量 1-5 级 |
| stressLevel | number | 压力水平 1-5 级 |

### 6.3 情绪周报（weeklyReport.vue）★新增

- **一键生成**：点击"生成本周周报"，后端聚合本周日记与会话数据生成报告
- **历史周报列表**：左侧卡片展示周区间、平均心情、平均睡眠
- **周报详情**：统计概览 + 情绪趋势可视化 + 周度总结

### 6.4 情绪急救箱（firstAidKit.vue）★新增

- **情绪自检**：选择当前情绪（图标九宫格）+ 心情打分（1-10 滑块）
- **智能推荐**：根据自检结果推荐匹配的调节练习
- **练习打卡**：记录练习前后的心情变化与反思
- **记录与统计**：历史打卡记录 + 练习效果统计

### 6.5 心理测评（assessment.vue）★新增

- **量表列表**：展示量表名称、描述、题数、预计时长
- **在线测评**：逐题作答、提交评分
- **结果分级**：总分 + 等级解读（不同等级不同颜色标识）
- **历史记录**：历次测评分数与等级回溯
- 页面内置提示：测评仅用于自我觉察，不构成医学诊断

### 6.6 知识库

- **前台**：`frontendKnowledge.vue`（分类浏览/搜索/分页）、`articleDetail.vue`（封面/正文/阅读量）
- **后台**：`knowledge.vue`（列表/搜索/发布下线/删除/分页）+ `ArticleDialog.vue`（新增编辑弹窗，含 wangEditor 富文本与封面图上传）

### 6.7 数据分析仪表盘（dashboard.vue）

**统计卡片**：用户总数（含活跃）、情绪日志（含今日新增）、咨询会话（含今日新增）、平均情绪评分

**图表**（ECharts 6）：

| 图表 | 类型 | 维度 |
|------|------|------|
| 情绪分析趋势 | 双 Y 轴折线图 | 每日平均情绪评分 + 记录数量 |
| 咨询会话统计 | 柱状图 + 指标卡 | 每日会话数、参与用户数、总数/平均时长 |
| 用户活跃度趋势 | 多系列折线/面积图 | 活跃/新增/日记用户/咨询用户 |

数据接口：`GET /data-analytics/overview`

---

## 七、请求层与数据流

### 7.1 Axios 封装（utils/request.js）

```javascript
// 配置
{ baseURL: "/api", timeout: 5000 }   // 经 Vite 代理到后端

// 请求拦截器：自动注入 Token
config.headers["token"] = localStorage.getItem("token")

// 响应拦截器：
// - code=200 → return data.data（自动解包）
// - code=-1  → 登录过期提示 + 清除 token + 跳转 /auth/login
// - 其他     → ElMessage.error 报错
```

### 7.2 API 分层

**frontend.js（21 个）**

| 模块 | 接口 |
|------|------|
| 用户 | `register` |
| AI 会话 | `startSession`, `getSessionList`, `deleteSession`, `getSessionDetail`, `getSessionEmotion` |
| 情绪日记 | `addEmotionDiary` |
| 情绪周报 ★ | `generateWeeklyReport`, `getWeeklyReportList`, `getWeeklyReportDetail` |
| 情绪急救箱 ★ | `getExerciseList`, `recommendExercises`, `createExerciseRecord`, `getExerciseRecords`, `getExerciseStats` |
| 心理测评 ★ | `getScaleList`, `getScaleDetail`, `submitAssessment`, `getAssessmentRecords` |
| 知识库 | `getKnowledgeList`, `getKnowledgeDetail` |

**admin.js（15 个）**

| 模块 | 接口 |
|------|------|
| 认证 | `login`, `logout` |
| 分类 | `categoryTree` |
| 文章 | `articlePage`, `uploadFile`, `createArticle`, `getArticleDetail`, `updataArticle`, `changeArticleStatus`, `deleteArticle` |
| 会话 | `getConsultationPage`, `getSessionDetail` |
| 情绪日志 | `getEmotionalPage`, `deleteEmotional` |
| 数据统计 | `getAnalyticsOverview` |

---

## 八、全局组件体系

| 组件 | 用途 |
|------|------|
| `FrontendLayout.vue` | 前台导航栏（品牌 Logo + 菜单 + 登录态）+ 页脚 |
| `BackendLayout.vue` | 后台经典布局（Sidebar + Navbar + 内容区） |
| `AuthLayout.vue` | 认证页左右分栏布局（品牌区 + 表单区） |
| `TableSearch.vue` | 通用表格搜索栏（formItem 配置动态生成表单） |
| `PageHead.vue` | 页面标题栏（标题 + 操作按钮插槽） |
| `ArticleDialog.vue` | 文章新增/编辑复用弹窗（富文本 + 封面上传 + 分类选择） |
| `MarkdownRenderer.vue` | AI 回复 Markdown 渲染 |
| `RichTextEditor.vue` | wangEditor 富文本封装 |

**状态管理（Pinia）**：`useAdminStore` 当前管理侧边栏折叠状态 `isCollapsed`。

---

## 九、UI / UX 设计特点

- **温暖治愈主题**：前台粉色渐变（#fc98be → #ffdce9）主色调，契合心理关怀定位
- **后台专业风格**：白底 + 彩色渐变卡片突出数据
- **玻璃拟态**：半透明背景 + `backdrop-filter: blur(10px)`
- **动效细节**：`breathing` 呼吸动画（AI 头像）、`pulse` 在状态指示、`typing` 三点打字指示、`fadeInUp` 消息气泡动画、卡片悬停位移/阴影
- **响应式**：前台内容宽 1200px、仪表盘 980px，自定义细滚动条

---

## 十、项目亮点

1. **双端一体架构**：一套代码承载前台与管理后台，路由守卫 + userType 无缝切换
2. **SSE 流式对话**：AI 对话流式输出，体验流畅
3. **情绪闭环**：日记记录 → 周报回顾 → 急救练习 → 测评筛查，覆盖"记录-洞察-调节-评估"完整情绪管理链路 ★
4. **情绪花园**：实时情绪分析 + 风险分级 + 治愈建议，体现专业心理学关怀
5. **数据可视化**：ECharts 多维图表支撑后台运营决策
6. **组件化程度高**：TableSearch、ArticleDialog、PageHead 等可复用组件
7. **完善权限体系**：Token + localStorage + 路由守卫三重保障
8. **温暖治愈 UI**：玻璃拟态 + 精致动画，契合心理健康产品定位
