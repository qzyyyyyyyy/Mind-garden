import service from "@/utils/request"

export const register = (data) => {
  return service.post("/user/add", data)
}

export const startSession = (data) => {
  return service.post("/psychological-chat/session/start", data)
}

export const getSessionList = (params) => {
  return service.get("/psychological-chat/sessions", { params })
}

export const deleteSession = (sessionId) => {
  return service.delete(`/psychological-chat/sessions/${sessionId}`)
}

export const getSessionDetail = (sessionId) => {
  return service.get(`/psychological-chat/sessions/${sessionId}/messages`)
}

export const getSessionEmotion = (sessionId) => {
  return service.get(`/psychological-chat/session/${sessionId}/emotion`)
}

export const addEmotionDiary = (data) => {
  return service.post("/emotion-diary", data)
}

export const getKnowledgeList = (params) => {
  return service.get("/knowledge/article/page", { params })
}

export const getKnowledgeDetail = (articleId) => {
  return service.get(`/knowledge/article/${articleId}`)
}

// 情绪周报
export const generateWeeklyReport = (data) => {
  return service.post("/emotion-weekly-report/generate", data)
}

export const getWeeklyReportList = (params) => {
  return service.get("/emotion-weekly-report/list", { params })
}

export const getWeeklyReportDetail = (id) => {
  return service.get(`/emotion-weekly-report/${id}`)
}

// 情绪急救箱
export const getExerciseList = () => {
  return service.get("/emotion-exercise/list")
}

export const recommendExercises = (params) => {
  return service.get("/emotion-exercise/recommend", { params })
}

export const createExerciseRecord = (data) => {
  return service.post("/emotion-exercise/record", data)
}

export const getExerciseRecords = (params) => {
  return service.get("/emotion-exercise/records", { params })
}

export const getExerciseStats = () => {
  return service.get("/emotion-exercise/stats")
}

// 心理测评
export const getScaleList = () => {
  return service.get("/assessment/scales")
}

export const getScaleDetail = (code) => {
  return service.get(`/assessment/scale/${code}`)
}

export const submitAssessment = (data) => {
  return service.post("/assessment/submit", data)
}

export const getAssessmentRecords = (params) => {
  return service.get("/assessment/records", { params })
}
