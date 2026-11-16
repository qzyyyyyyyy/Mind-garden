-- 情绪周报表
-- 执行方式：在 MySQL 客户端中执行本脚本，或使用 prisma db execute --file prisma/create_weekly_report_table.sql
CREATE TABLE IF NOT EXISTS `emotion_weekly_report` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `week_start` DATETIME(3) NOT NULL,
  `week_end` DATETIME(3) NOT NULL,
  `report_content` JSON NOT NULL,
  `mood_trend` JSON NULL,
  `trigger_stats` JSON NULL,
  `avg_mood_score` DOUBLE NULL,
  `avg_sleep_quality` DOUBLE NULL,
  `avg_stress_level` DOUBLE NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_week_unique` (`user_id`, `week_start`),
  CONSTRAINT `emotion_weekly_report_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
