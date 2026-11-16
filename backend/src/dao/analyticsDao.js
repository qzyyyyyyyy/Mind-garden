import { queryRaw, queryRawOne } from "../config/database.js"

// 系统总览
export async function getSystemOverview() {
  const totalUsersRow = await queryRawOne("SELECT COUNT(*) AS cnt FROM `user`")
  const activeUsersRow = await queryRawOne(
    "SELECT COUNT(*) AS cnt FROM `user` WHERE status = 1"
  )
  const totalDiariesRow = await queryRawOne(
    "SELECT COUNT(*) AS cnt FROM emotion_diary"
  )
  const todayNewDiariesRow = await queryRawOne(
    "SELECT COUNT(*) AS cnt FROM emotion_diary WHERE DATE(diary_date) = CURDATE()"
  )
  const totalSessionsRow = await queryRawOne(
    "SELECT COUNT(*) AS cnt FROM consultation_session"
  )
  const todayNewSessionsRow = await queryRawOne(
    "SELECT COUNT(*) AS cnt FROM consultation_session WHERE DATE(started_at) = CURDATE()"
  )
  const avgMoodRow = await queryRawOne(
    "SELECT AVG(mood_score) AS avg FROM emotion_diary WHERE mood_score IS NOT NULL"
  )

  return {
    totalUsers: Number(totalUsersRow?.cnt || 0),
    activeUsers: Number(activeUsersRow?.cnt || 0),
    totalDiaries: Number(totalDiariesRow?.cnt || 0),
    todayNewDiaries: Number(todayNewDiariesRow?.cnt || 0),
    totalSessions: Number(totalSessionsRow?.cnt || 0),
    todayNewSessions: Number(todayNewSessionsRow?.cnt || 0),
    avgMoodScore: avgMoodRow?.avg
      ? Math.round(Number(avgMoodRow.avg) * 10) / 10
      : 0
  }
}

// 咨询统计 + 7 日趋势
export async function getConsultationStats() {
  const totalRow = await queryRawOne(
    "SELECT COUNT(*) AS cnt FROM consultation_session"
  )
  const avgDurationRow = await queryRawOne(
    `SELECT AVG(TIMESTAMPDIFF(MINUTE, s.started_at,
        (SELECT MAX(m.created_at) FROM consultation_message m WHERE m.session_id = s.id))
     ) AS avg
       FROM consultation_session s
      WHERE (SELECT COUNT(*) FROM consultation_message m WHERE m.session_id = s.id) > 0`
  )

  // 最近 7 天每日会话数和活跃用户数
  const dailyTrend = await queryRaw(
    `SELECT DATE(s.started_at) AS date,
            COUNT(*) AS session_count,
            COUNT(DISTINCT s.user_id) AS user_count
       FROM consultation_session s
      WHERE s.started_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(s.started_at)
      ORDER BY DATE(s.started_at) ASC`
  )

  return {
    totalSessions: Number(totalRow?.cnt || 0),
    avgDurationMinutes: avgDurationRow?.avg
      ? Math.round(Number(avgDurationRow.avg))
      : 0,
    dailyTrend: dailyTrend.map((r) => ({
      date: formatDate(r.date),
      sessionCount: Number(r.session_count),
      userCount: Number(r.user_count)
    }))
  }
}

// 情绪趋势（最近 7 天）
export async function getEmotionTrend() {
  const rows = await queryRaw(
    `SELECT DATE(diary_date) AS date,
            AVG(mood_score) AS avg_mood_score,
            COUNT(*) AS record_count
       FROM emotion_diary
      WHERE diary_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND mood_score IS NOT NULL
      GROUP BY DATE(diary_date)
      ORDER BY DATE(diary_date) ASC`
  )

  return rows.map((r) => ({
    date: formatDate(r.date),
    avgMoodScore: r.avg_mood_score
      ? Math.round(Number(r.avg_mood_score) * 10) / 10
      : 0,
    recordCount: Number(r.record_count)
  }))
}

// 用户活动（最近 7 天）
export async function getUserActivity() {
  // 活跃用户（每日）
  const rows = await queryRaw(
    `SELECT dates.d AS date,
            (SELECT COUNT(DISTINCT user_id) FROM consultation_session WHERE DATE(started_at) = dates.d) AS active_users,
            (SELECT COUNT(DISTINCT id) FROM user WHERE DATE(created_at) = dates.d) AS new_users,
            (SELECT COUNT(DISTINCT user_id) FROM emotion_diary WHERE DATE(diary_date) = dates.d) AS diary_users,
            (SELECT COUNT(DISTINCT user_id) FROM consultation_session WHERE DATE(started_at) = dates.d) AS consultation_users
       FROM (
         SELECT DATE_SUB(CURDATE(), INTERVAL n DAY) AS d
           FROM (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) days
       ) dates
      WHERE dates.d >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      ORDER BY dates.d ASC`
  )

  return rows.map((r) => ({
    date: formatDate(r.date),
    activeUsers: Number(r.active_users || 0),
    newUsers: Number(r.new_users || 0),
    diaryUsers: Number(r.diary_users || 0),
    consultationUsers: Number(r.consultation_users || 0)
  }))
}

function formatDate(d) {
  if (!d) return null
  if (d instanceof Date) {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }
  // mysql DATE 类型返回 'YYYY-MM-DD' 字符串
  return String(d).slice(0, 10)
}
