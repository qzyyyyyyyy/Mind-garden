import express from "express"
import cors from "cors"
import morgan from "morgan"
import path from "path"
import { fileURLToPath } from "url"

import { env } from "./config/env.js"
import { authMiddleware } from "./middleware/auth.js"
import { notFoundHandler, errorHandler } from "./common/errorHandler.js"

import userRoutes from "./routes/userRoutes.js"
import chatRoutes from "./routes/chatRoutes.js"
import diaryRoutes from "./routes/diaryRoutes.js"
import knowledgeRoutes from "./routes/knowledgeRoutes.js"
import fileRoutes from "./routes/fileRoutes.js"
import analyticsRoutes from "./routes/analyticsRoutes.js"
import reportRoutes from "./routes/reportRoutes.js"
import exerciseRoutes from "./routes/exerciseRoutes.js"
import assessmentRoutes from "./routes/assessmentRoutes.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")

const app = express()

// 全局中间件
app.use(cors())
app.use(express.json({ limit: "5mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))

// 静态文件服务：/files → public 目录（对应 sys_file_info.file_path 中的 /files/... 前缀）
app.use(
  "/files",
  express.static(path.join(projectRoot, env.uploadDir), {
    maxAge: "7d"
  })
)

// 鉴权中间件：公开路径放行，其余需要 token
app.use(authMiddleware)

// 业务路由（统一挂 /api 前缀）
app.use("/api", userRoutes)
app.use("/api", chatRoutes)
app.use("/api", diaryRoutes)
app.use("/api", knowledgeRoutes)
app.use("/api", fileRoutes)
app.use("/api", analyticsRoutes)
app.use("/api", reportRoutes)
app.use("/api", exerciseRoutes)
app.use("/api", assessmentRoutes)

// 兜底
app.use(notFoundHandler)
app.use(errorHandler)

app.listen(env.port, () => {
  console.log(`[ai-express] listening on http://localhost:${env.port}`)
  console.log(
    `[ai-express] MySQL: ${env.db.host}:${env.db.port}/${env.db.name}`
  )
  console.log(
    `[ai-express] LLM: ${env.llm.baseURL} | model=${env.llm.model} | apiKey=${
      env.llm.apiKey && env.llm.apiKey !== "you-key"
        ? "已配置"
        : "未配置(请在 .env 填写 LLM_API_KEY)"
    }`
  )
})
