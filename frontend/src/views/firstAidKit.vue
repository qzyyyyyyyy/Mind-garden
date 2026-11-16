<template>
  <div class="first-aid-container">
    <!-- 顶部标题区 -->
    <div class="header-section">
      <div class="header-content">
        <div class="title-wrap">
          <div class="header-icon">🧰</div>
          <div>
            <h1>情绪急救箱</h1>
            <p class="subtitle">
              此刻的情绪值得被温柔接住，选一个练习，开始照顾自己
            </p>
          </div>
        </div>
        <el-button
          v-if="step !== 'checkin'"
          @click="backToCheckin"
          :disabled="practicing"
        >
          <el-icon><MagicStick /></el-icon>
          重新自检
        </el-button>
      </div>
    </div>

    <div class="content">
      <!-- 第一步：情绪自检 -->
      <div class="card" v-if="step === 'checkin'">
        <div class="section-title">我现在感觉...</div>
        <div class="emotion-grid">
          <div
            v-for="emo in emotionOptions"
            :key="emo.name"
            class="emotion-item"
            :class="{ selected: checkinForm.emotion === emo.name }"
            @click="checkinForm.emotion = emo.name"
          >
            <img :src="emo.url" alt="" />
            <span>{{ emo.name }}</span>
          </div>
        </div>

        <div class="section-title" style="margin-top: 28px">
          给此刻的心情打个分（1-10）
        </div>
        <div class="mood-slider">
          <el-slider
            v-model="checkinForm.moodScore"
            :min="1"
            :max="10"
            show-input
            input-size="small"
          />
        </div>

        <div class="action-bar">
          <el-button
            type="primary"
            size="large"
            :loading="recommending"
            @click="handleRecommend"
          >
            <el-icon><MagicStick /></el-icon>
            获取我的急救练习
          </el-button>
        </div>
      </div>

      <!-- 求助模式提示 -->
      <div
        class="help-card"
        v-if="helpMode && (step === 'recommend' || step === 'practice')"
      >
        <div class="help-title">先照顾好自己</div>
        <p class="help-message">{{ hotline.message }}</p>
        <div class="hotline-list">
          <div class="hotline-item">
            <span>{{ hotline.title }}</span>
            <strong>{{ hotline.phone }}</strong>
          </div>
          <div class="hotline-item">
            <span>{{ hotline.backupTitle }}</span>
            <strong>{{ hotline.backupPhone }}</strong>
          </div>
        </div>
        <p class="help-tip">以下练习可以在你准备好之后，作为温和的辅助。</p>
      </div>

      <!-- 第二步：推荐练习 -->
      <div class="card" v-if="step === 'recommend'">
        <div class="section-title">{{ recommendReason }}</div>
        <div class="exercise-grid">
          <div
            v-for="ex in recommendations"
            :key="ex.id"
            class="exercise-card"
            @click="startPractice(ex)"
          >
            <div class="ex-icon">{{ ex.icon }}</div>
            <div class="ex-body">
              <div class="ex-name">{{ ex.name }}</div>
              <div class="ex-meta">
                <el-tag size="small" effect="plain">{{ ex.category }}</el-tag>
                <span class="ex-duration"
                  >约 {{ ex.durationMinutes }} 分钟</span
                >
              </div>
              <p class="ex-desc">{{ ex.description }}</p>
            </div>
            <div class="ex-go">开始练习 →</div>
          </div>
        </div>
      </div>

      <!-- 第三步：分步跟练 -->
      <div class="card practice-card" v-if="step === 'practice'">
        <div class="practice-head">
          <div class="practice-name">
            {{ currentExercise.icon }} {{ currentExercise.name }}
          </div>
          <div class="practice-timer">{{ timerText }}</div>
        </div>
        <div class="step-progress">
          <div
            v-for="(s, i) in currentExercise.steps"
            :key="i"
            class="progress-dot"
            :class="{ done: i < currentStep, active: i === currentStep }"
          >
            {{ i + 1 }}
          </div>
        </div>
        <div class="step-content">
          <div class="step-index">
            第 {{ currentStep + 1 }} 步 / 共
            {{ currentExercise.steps.length }} 步
          </div>
          <p class="step-text">{{ currentExercise.steps[currentStep] }}</p>
        </div>
        <div class="action-bar">
          <el-button
            v-if="currentStep < currentExercise.steps.length - 1"
            type="primary"
            @click="nextStep"
          >
            下一步
          </el-button>
          <el-button type="success" @click="finishPractice">
            完成练习，记录我的感受
          </el-button>
        </div>
      </div>

      <!-- 第四步：练后评估 -->
      <div class="card" v-if="step === 'evaluate'">
        <div class="section-title">练习结束了，现在感觉怎么样？</div>
        <div class="mood-slider">
          <el-slider
            v-model="evaluateForm.moodAfter"
            :min="1"
            :max="10"
            show-input
            input-size="small"
          />
        </div>
        <div class="section-title" style="margin-top: 24px">
          想说点什么？（选填）
        </div>
        <el-input
          v-model="evaluateForm.reflection"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="记录此刻的感受、身体的变化，或者什么都没发生也没关系..."
        />
        <div class="action-bar">
          <el-button
            type="primary"
            size="large"
            :loading="saving"
            @click="submitRecord"
          >
            完成打卡
          </el-button>
        </div>
      </div>

      <!-- 第五步：打卡反馈 -->
      <div class="card done-card" v-if="step === 'done'">
        <div class="done-icon">🌱</div>
        <div class="done-title">打卡成功！</div>
        <div
          class="done-improvement"
          v-if="lastResult && lastResult.improvement !== null"
        >
          情绪分
          <span class="before">{{ lastResult.record.moodBefore }}</span>
          <span class="arrow">→</span>
          <span class="after">{{ lastResult.record.moodAfter }}</span>
          <el-tag type="success" effect="dark" style="margin-left: 8px">
            提升 {{ lastResult.improvement }} 分
          </el-tag>
        </div>
        <p class="done-encourage">{{ lastResult?.encourage }}</p>
        <div class="action-bar">
          <el-button type="primary" @click="backToCheckin">再来一次</el-button>
        </div>
      </div>

      <!-- 统计与历史 -->
      <div class="stats-section" v-if="stats">
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">累计打卡（次）</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">
              {{ stats.streak }}<span class="unit">天</span>
            </div>
            <div class="stat-label">连续打卡</div>
          </div>
          <div class="stat-card">
            <div
              class="stat-value"
              :class="{ positive: stats.avgImprovement > 0 }"
            >
              {{ stats.avgImprovement ?? "-" }}
            </div>
            <div class="stat-label">平均情绪改善</div>
          </div>
          <div class="stat-card">
            <div class="stat-value best-name">
              {{ stats.mostEffective?.name || "继续加油" }}
            </div>
            <div class="stat-label" v-if="stats.mostEffective">
              最有效 · 平均 +{{ stats.mostEffective.avgImprovement }} 分
            </div>
            <div class="stat-label" v-else>完成打卡后揭晓</div>
          </div>
        </div>

        <div class="card" v-if="recordList.length > 0">
          <div class="section-title">最近的打卡</div>
          <div class="record-list">
            <div v-for="r in recordList" :key="r.id" class="record-item">
              <div class="record-icon">{{ r.exercise?.icon || "📝" }}</div>
              <div class="record-body">
                <div class="record-name">{{ r.exercise?.name || "练习" }}</div>
                <div class="record-meta">
                  <span v-if="r.sourceEmotion"
                    >因「{{ r.sourceEmotion }}」开始</span
                  >
                  <span>{{ r.completedAt }}</span>
                </div>
              </div>
              <div
                class="record-change"
                v-if="r.moodBefore != null && r.moodAfter != null"
              >
                <span class="before">{{ r.moodBefore }}</span> →
                <span
                  class="after"
                  :class="{ positive: r.moodAfter > r.moodBefore }"
                  >{{ r.moodAfter }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue"
import { ElMessage } from "element-plus"
import { MagicStick } from "@element-plus/icons-vue"
import {
  recommendExercises,
  createExerciseRecord,
  getExerciseRecords,
  getExerciseStats
} from "@/api/frontend"

// 情绪选项（与情绪日记页对齐，复用同一套图标）
const emotionOptions = [
  {
    name: "开心",
    url: new URL("@/assets/images/开心.png", import.meta.url).href
  },
  {
    name: "平静",
    url: new URL("@/assets/images/平静.png", import.meta.url).href
  },
  {
    name: "焦虑",
    url: new URL("@/assets/images/焦虑.png", import.meta.url).href
  },
  {
    name: "悲伤",
    url: new URL("@/assets/images/悲伤.png", import.meta.url).href
  },
  {
    name: "兴奋",
    url: new URL("@/assets/images/兴奋.png", import.meta.url).href
  },
  {
    name: "疲惫",
    url: new URL("@/assets/images/疲惫.png", import.meta.url).href
  },
  {
    name: "惊讶",
    url: new URL("@/assets/images/惊讶.png", import.meta.url).href
  },
  {
    name: "困惑",
    url: new URL("@/assets/images/困惑.png", import.meta.url).href
  }
]

// 流程状态：checkin 自检 → recommend 推荐 → practice 跟练 → evaluate 评估 → done 反馈
const step = ref("checkin")
const recommending = ref(false)
const saving = ref(false)

const checkinForm = reactive({ emotion: "", moodScore: 5 })
const helpMode = ref(false)
const hotline = ref(null)
const recommendReason = ref("")
const recommendations = ref([])

const currentExercise = ref(null)
const currentStep = ref(0)
const evaluateForm = reactive({ moodAfter: 5, reflection: "" })
const lastResult = ref(null)

const stats = ref(null)
const recordList = ref([])

// 计时器
const elapsedSeconds = ref(0)
let timerId = null
const timerText = computed(() => {
  const m = String(Math.floor(elapsedSeconds.value / 60)).padStart(2, "0")
  const s = String(elapsedSeconds.value % 60).padStart(2, "0")
  return `${m}:${s}`
})

// 获取推荐
const handleRecommend = async () => {
  if (!checkinForm.emotion) {
    ElMessage.warning("先选一个最贴近此刻的情绪吧")
    return
  }
  recommending.value = true
  try {
    const res = await recommendExercises({
      emotion: checkinForm.emotion,
      moodScore: checkinForm.moodScore
    })
    helpMode.value = !!res.helpMode
    hotline.value = res.hotline
    recommendReason.value = res.reason
    recommendations.value = res.recommendations || []
    step.value = "recommend"
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || "获取推荐失败，请稍后重试")
  } finally {
    recommending.value = false
  }
}

// 开始跟练
const startPractice = (ex) => {
  currentExercise.value = ex
  currentStep.value = 0
  elapsedSeconds.value = 0
  timerId = setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)
  step.value = "practice"
}

const nextStep = () => {
  if (currentStep.value < currentExercise.value.steps.length - 1) {
    currentStep.value += 1
  }
}

// 结束跟练，进入评估
const finishPractice = () => {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
  evaluateForm.moodAfter = checkinForm.moodScore
  evaluateForm.reflection = ""
  step.value = "evaluate"
}

// 提交打卡
const submitRecord = async () => {
  saving.value = true
  try {
    const res = await createExerciseRecord({
      exerciseId: currentExercise.value.id,
      sourceEmotion: checkinForm.emotion,
      moodBefore: checkinForm.moodScore,
      moodAfter: evaluateForm.moodAfter,
      reflection: evaluateForm.reflection,
      durationSeconds: elapsedSeconds.value
    })
    lastResult.value = res
    step.value = "done"
    ElMessage.success("打卡成功")
    loadStats()
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || "打卡失败，请稍后重试")
  } finally {
    saving.value = false
  }
}

// 回到自检
const backToCheckin = () => {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
  step.value = "checkin"
  helpMode.value = false
  hotline.value = null
}

// 加载统计与历史
const loadStats = async () => {
  try {
    const [s, r] = await Promise.all([
      getExerciseStats(),
      getExerciseRecords({ pageNum: 1, pageSize: 5 })
    ])
    stats.value = s
    recordList.value = r?.records || []
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadStats()
})

onBeforeUnmount(() => {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
})
</script>

<style lang="scss" scoped>
.first-aid-container {
  background: linear-gradient(135deg, #fafbfc 0%, #f7f9fc 50%, #f2f6fa 100%);
  min-height: calc(100vh - 285px);

  .header-section {
    background: linear-gradient(135deg, #4a90e2 0%, #7ed321 100%);
    color: white;
    padding: 40px;
    .header-content {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .title-wrap {
        display: flex;
        align-items: center;
        gap: 14px;
        .header-icon {
          font-size: 42px;
        }
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
    max-width: 1000px;
    margin: 0 auto;
    padding: 24px;
  }

  .card {
    background: white;
    border-radius: 12px;
    padding: 28px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .section-title {
    font-size: 17px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 16px;
  }

  /* 情绪选择 */
  .emotion-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    .emotion-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 8px;
      border: 2px solid transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      background: #f9fafb;
      img {
        width: 48px;
        height: 48px;
      }
      span {
        font-size: 14px;
        color: #4b5563;
      }
      &:hover {
        transform: translateY(-2px);
        background: #f0fdf4;
      }
      &.selected {
        border-color: #7ed321;
        background: #f0fdf4;
      }
    }
  }

  .mood-slider {
    padding: 0 12px;
  }

  .action-bar {
    margin-top: 28px;
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  /* 求助模式 */
  .help-card {
    background: linear-gradient(135deg, #fff7ed, #ffedd5);
    border: 1px solid #fdba74;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    .help-title {
      font-size: 17px;
      font-weight: 700;
      color: #9a3412;
      margin-bottom: 8px;
    }
    .help-message {
      color: #7c2d12;
      font-size: 14px;
      line-height: 1.7;
      margin: 0 0 14px;
    }
    .hotline-list {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      .hotline-item {
        background: white;
        border-radius: 10px;
        padding: 12px 18px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        span {
          font-size: 13px;
          color: #6b7280;
        }
        strong {
          font-size: 20px;
          color: #ea580c;
        }
      }
    }
    .help-tip {
      margin: 14px 0 0;
      font-size: 13px;
      color: #9a3412;
    }
  }

  /* 推荐列表 */
  .exercise-grid {
    display: flex;
    flex-direction: column;
    gap: 14px;
    .exercise-card {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 18px;
      border: 2px solid #f3f4f6;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        border-color: #7ed321;
        background: #f7fee7;
        transform: translateX(4px);
        .ex-go {
          color: #65a30d;
        }
      }
      .ex-icon {
        font-size: 36px;
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f0fdf4;
        border-radius: 12px;
        flex-shrink: 0;
      }
      .ex-body {
        flex: 1;
        min-width: 0;
        .ex-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 6px;
        }
        .ex-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
          .ex-duration {
            font-size: 13px;
            color: #9ca3af;
          }
        }
        .ex-desc {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
        }
      }
      .ex-go {
        font-size: 14px;
        color: #9ca3af;
        flex-shrink: 0;
        font-weight: 500;
      }
    }
  }

  /* 跟练 */
  .practice-card {
    text-align: center;
    .practice-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      .practice-name {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
      }
      .practice-timer {
        font-size: 22px;
        font-weight: 700;
        color: #4a90e2;
        font-variant-numeric: tabular-nums;
      }
    }
    .step-progress {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 24px;
      .progress-dot {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        background: #f3f4f6;
        color: #9ca3af;
        &.active {
          background: #7ed321;
          color: white;
          font-weight: 600;
        }
        &.done {
          background: #d9f99d;
          color: #4d7c0f;
        }
      }
    }
    .step-content {
      background: #f9fafb;
      border-radius: 12px;
      padding: 32px 24px;
      .step-index {
        font-size: 13px;
        color: #9ca3af;
        margin-bottom: 12px;
      }
      .step-text {
        font-size: 18px;
        color: #374151;
        line-height: 1.8;
        margin: 0;
      }
    }
  }

  /* 打卡反馈 */
  .done-card {
    text-align: center;
    .done-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    .done-title {
      font-size: 22px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
    }
    .done-improvement {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 16px;
      .before {
        color: #9ca3af;
        text-decoration: line-through;
      }
      .arrow {
        margin: 0 8px;
      }
      .after {
        font-size: 24px;
        font-weight: 700;
        color: #65a30d;
      }
    }
    .done-encourage {
      font-size: 15px;
      color: #4b5563;
      line-height: 1.7;
      max-width: 480px;
      margin: 0 auto;
    }
  }

  /* 统计 */
  .stats-section {
    .stat-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 6px;
          .unit {
            font-size: 14px;
            font-weight: 400;
            color: #9ca3af;
            margin-left: 2px;
          }
          &.positive {
            color: #65a30d;
          }
          &.best-name {
            font-size: 16px;
          }
        }
        .stat-label {
          font-size: 13px;
          color: #9ca3af;
        }
      }
    }
  }

  /* 历史 */
  .record-list {
    .record-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid #f3f4f6;
      &:last-child {
        border-bottom: none;
      }
      .record-icon {
        width: 42px;
        height: 42px;
        background: #f0fdf4;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
      }
      .record-body {
        flex: 1;
        min-width: 0;
        .record-name {
          font-size: 15px;
          font-weight: 500;
          color: #374151;
        }
        .record-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
        }
      }
      .record-change {
        font-size: 14px;
        color: #9ca3af;
        .after.positive {
          color: #65a30d;
          font-weight: 600;
        }
      }
    }
  }
}
</style>
