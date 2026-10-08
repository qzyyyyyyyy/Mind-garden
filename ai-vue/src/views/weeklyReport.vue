<template>
  <div class="weekly-report-container">
    <!-- 顶部标题区 -->
    <div class="header-section">
      <div class="header-content">
        <div class="title-wrap">
          <el-image :src="iconUrl" style="width: 56px; height: 56px"></el-image>
          <div>
            <h1>情绪周报</h1>
            <p class="subtitle">每周一次，温柔回顾你的情绪足迹</p>
          </div>
        </div>
        <el-button
          type="primary"
          size="large"
          :loading="generating"
          @click="handleGenerate"
        >
          <el-icon><MagicStick /></el-icon>
          生成本周周报
        </el-button>
      </div>
    </div>

    <div class="content">
      <div class="layout">
        <!-- 左侧：周报列表 -->
        <div class="list-panel">
          <div class="panel-title">历史周报</div>
          <div v-if="reportList.length === 0" class="empty-tip">
            <el-empty description="还没有周报，点击右上角生成第一份吧～" />
          </div>
          <div
            v-for="item in reportList"
            :key="item.id"
            class="report-card"
            :class="{ active: currentReport && currentReport.id === item.id }"
            @click="selectReport(item)"
          >
            <div class="week-range">
              {{ item.weekStart }} ~ {{ item.weekEnd }}
            </div>
            <div class="card-stats">
              <span class="stat-item">
                <el-icon><Sunny /></el-icon>
                心情 {{ item.avgMoodScore ?? "-" }}
              </span>
              <span class="stat-item">
                <el-icon><Moon /></el-icon>
                睡眠 {{ item.avgSleepQuality ?? "-" }}
              </span>
            </div>
          </div>
        </div>

        <!-- 右侧：周报详情 -->
        <div class="detail-panel">
          <template v-if="currentReport">
            <!-- 统计概览 -->
            <div class="stat-cards">
              <div class="stat-card mood">
                <div class="stat-icon">
                  <el-icon><Sunny /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">
                    {{ currentReport.avgMoodScore ?? "-" }}
                  </div>
                  <div class="stat-label">平均心情</div>
                </div>
              </div>
              <div class="stat-card sleep">
                <div class="stat-icon">
                  <el-icon><Moon /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">
                    {{ currentReport.avgSleepQuality ?? "-" }}
                  </div>
                  <div class="stat-label">平均睡眠</div>
                </div>
              </div>
              <div class="stat-card stress">
                <div class="stat-icon">
                  <el-icon><Odometer /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">
                    {{ currentReport.avgStressLevel ?? "-" }}
                  </div>
                  <div class="stat-label">平均压力</div>
                </div>
              </div>
            </div>

            <!-- 心情趋势图 -->
            <div class="chart-card">
              <div class="section-title">本周心情走势</div>
              <div ref="chartRef" class="trend-chart"></div>
            </div>

            <!-- 整体回顾 -->
            <div class="content-card">
              <div class="section-title">
                <el-icon><ChatDotRound /></el-icon>
                本周情绪回顾
              </div>
              <p class="summary-text">{{ report.summary }}</p>
              <div class="trend-tag">
                <el-tag :type="trendTagType" effect="light">
                  {{ report.moodTrend?.label }}
                </el-tag>
                <span class="trend-desc">{{
                  report.moodTrend?.description
                }}</span>
              </div>
            </div>

            <!-- 高频触发因素 -->
            <div
              class="content-card"
              v-if="report.topTriggers && report.topTriggers.length"
            >
              <div class="section-title">
                <el-icon><Warning /></el-icon>
                高频情绪触发因素
              </div>
              <div class="trigger-list">
                <div
                  v-for="(t, i) in report.topTriggers"
                  :key="i"
                  class="trigger-item"
                >
                  <div class="trigger-head">
                    <span class="trigger-rank">{{ i + 1 }}</span>
                    <span class="trigger-name">{{ t.trigger }}</span>
                    <el-tag size="small" type="info"
                      >出现 {{ t.count }} 次</el-tag
                    >
                  </div>
                  <p class="trigger-insight">{{ t.insight }}</p>
                </div>
              </div>
            </div>

            <!-- 改善建议 -->
            <div
              class="content-card"
              v-if="
                report.improvementSuggestions &&
                report.improvementSuggestions.length
              "
            >
              <div class="section-title">
                <el-icon><Star /></el-icon>
                改善建议
              </div>
              <ul class="suggestion-list">
                <li v-for="(s, i) in report.improvementSuggestions" :key="i">
                  <el-icon><Check /></el-icon>
                  {{ s }}
                </li>
              </ul>
            </div>

            <!-- 下周小目标 -->
            <div
              class="content-card"
              v-if="report.nextWeekGoals && report.nextWeekGoals.length"
            >
              <div class="section-title">
                <el-icon><Flag /></el-icon>
                下周小目标
              </div>
              <div class="goal-list">
                <div
                  v-for="(g, i) in report.nextWeekGoals"
                  :key="i"
                  class="goal-item"
                >
                  <el-icon><Aim /></el-icon>
                  <span>{{ g }}</span>
                </div>
              </div>
            </div>

            <!-- 温暖寄语 -->
            <div class="warm-card">
              <el-icon class="warm-icon"><Bell /></el-icon>
              <p class="warm-text">{{ report.warmMessage }}</p>
            </div>
          </template>

          <div v-else class="empty-detail">
            <el-empty description="选择左侧周报查看详情，或生成新的周报" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from "vue"
import { ElMessage } from "element-plus"
import {
  MagicStick,
  Sunny,
  Moon,
  Odometer,
  ChatDotRound,
  Warning,
  Star,
  Check,
  Flag,
  Aim,
  Bell
} from "@element-plus/icons-vue"
import * as echarts from "echarts"
import { generateWeeklyReport, getWeeklyReportList } from "@/api/frontend"

const iconUrl = new URL("@/assets/images/like.png", import.meta.url).href

const reportList = ref([])
const currentReport = ref(null)
const generating = ref(false)
const chartRef = ref(null)
let chartInstance = null

const report = computed(() => currentReport.value?.reportContent || {})

const trendTagType = computed(() => {
  const label = report.value.moodTrend?.label || ""
  if (label.includes("回升") || label.includes("平稳")) return "success"
  if (label.includes("偏低") || label.includes("低落")) return "danger"
  if (label.includes("波动")) return "warning"
  return "info"
})

// 加载周报列表
const loadList = async () => {
  try {
    const res = await getWeeklyReportList({ pageNum: 1, pageSize: 20 })
    // 拦截器已返回后端 data 字段，res 即 { records, total, ... }
    reportList.value = res?.records || []
    if (reportList.value.length > 0 && !currentReport.value) {
      selectReport(reportList.value[0])
    }
  } catch (e) {
    console.error(e)
  }
}

// 选择周报
const selectReport = (item) => {
  currentReport.value = item
  nextTick(() => renderChart())
}

// 生成周报
const handleGenerate = async () => {
  generating.value = true
  try {
    const res = await generateWeeklyReport({})
    ElMessage.success("周报生成成功")
    // 拦截器已返回后端 data 字段，res 即周报对象本身
    currentReport.value = res
    await loadList()
    nextTick(() => renderChart())
  } catch (e) {
    ElMessage.error(e?.message || "生成失败，请稍后重试")
  } finally {
    generating.value = false
  }
}

// 渲染心情趋势图
const renderChart = () => {
  if (!chartRef.value) return
  if (chartInstance) {
    chartInstance.dispose()
  }
  chartInstance = echarts.init(chartRef.value)

  const trend = currentReport.value?.moodTrend || []
  const dates = trend.map((t) => t.date?.slice(5) || "")
  const scores = trend.map((t) => t.moodScore ?? null)

  chartInstance.setOption({
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const p = params[0]
        return `${p.axisValue}<br/>心情分：${p.value ?? "未记录"}`
      }
    },
    xAxis: {
      type: "category",
      data: dates,
      axisLine: { lineStyle: { color: "#E5E7EB" } },
      axisLabel: { color: "#6B7280" }
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 10,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#F3F4F6" } },
      axisLabel: { color: "#6B7280" }
    },
    series: [
      {
        data: scores,
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { width: 3, color: "#7ED321" },
        itemStyle: { color: "#7ED321", borderColor: "#fff", borderWidth: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(126,211,33,0.3)" },
              { offset: 1, color: "rgba(126,211,33,0.02)" }
            ]
          }
        },
        connectNulls: true
      }
    ]
  })
}

onMounted(() => {
  loadList()
  window.addEventListener("resize", handleResize)
})

const handleResize = () => {
  chartInstance && chartInstance.resize()
}

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style lang="scss" scoped>
.weekly-report-container {
  background: linear-gradient(135deg, #fafbfc 0%, #f7f9fc 50%, #f2f6fa 100%);
  min-height: calc(100vh - 285px);

  .header-section {
    background: linear-gradient(135deg, #7ed321 0%, #4a90e2 100%);
    color: white;
    padding: 40px;
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .title-wrap {
        display: flex;
        align-items: center;
        gap: 14px;
        h1 {
          font-size: 28px;
          font-weight: 600;
          margin: 0;
        }
        .subtitle {
          margin: 4px 0 0;
          font-size: 14px;
          opacity: 0.85;
        }
      }
    }
  }

  .content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
  }

  .layout {
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }

  /* 左侧列表 */
  .list-panel {
    width: 300px;
    flex-shrink: 0;
    .panel-title {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 16px;
    }
    .empty-tip {
      background: white;
      border-radius: 12px;
      padding: 20px;
    }
    .report-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
      &.active {
        border-color: #7ed321;
        background: #f0fdf4;
      }
      .week-range {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 10px;
      }
      .card-stats {
        display: flex;
        gap: 16px;
        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #6b7280;
        }
      }
    }
  }

  /* 右侧详情 */
  .detail-panel {
    flex: 1;
    min-width: 0;
  }

  .stat-cards {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    .stat-card {
      flex: 1;
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;
      }
      &.mood .stat-icon {
        background: linear-gradient(135deg, #7ed321, #5cb300);
      }
      &.sleep .stat-icon {
        background: linear-gradient(135deg, #4a90e2, #2e6fb8);
      }
      &.stress .stat-icon {
        background: linear-gradient(135deg, #f5a623, #d98c0f);
      }
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #374151;
      }
      .stat-label {
        font-size: 13px;
        color: #6b7280;
        margin-top: 2px;
      }
    }
  }

  .chart-card,
  .content-card,
  .warm-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 17px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 16px;
    .el-icon {
      color: #7ed321;
    }
  }

  .trend-chart {
    width: 100%;
    height: 280px;
  }

  .summary-text {
    font-size: 15px;
    line-height: 1.8;
    color: #4b5563;
    margin: 0 0 16px;
  }

  .trend-tag {
    display: flex;
    align-items: center;
    gap: 12px;
    .trend-desc {
      color: #6b7280;
      font-size: 14px;
    }
  }

  .trigger-list {
    .trigger-item {
      padding: 14px;
      background: #f9fafb;
      border-radius: 10px;
      margin-bottom: 10px;
      .trigger-head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
        .trigger-rank {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #7ed321;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
        }
        .trigger-name {
          font-weight: 600;
          color: #374151;
          font-size: 15px;
        }
      }
      .trigger-insight {
        margin: 0 0 0 34px;
        color: #6b7280;
        font-size: 14px;
        line-height: 1.6;
      }
    }
  }

  .suggestion-list {
    list-style: none;
    padding: 0;
    margin: 0;
    li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 0;
      color: #4b5563;
      font-size: 14px;
      line-height: 1.6;
      .el-icon {
        color: #7ed321;
        margin-top: 3px;
        flex-shrink: 0;
      }
    }
  }

  .goal-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    .goal-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
      border-radius: 10px;
      color: #374151;
      font-size: 14px;
      .el-icon {
        color: #7ed321;
      }
    }
  }

  .warm-card {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    text-align: center;
    .warm-icon {
      font-size: 32px;
      color: #d97706;
      margin-bottom: 12px;
    }
    .warm-text {
      margin: 0;
      font-size: 17px;
      color: #92400e;
      font-weight: 500;
      line-height: 1.6;
    }
  }

  .empty-detail {
    background: white;
    border-radius: 12px;
    padding: 60px 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
}
</style>
