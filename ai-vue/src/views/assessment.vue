<template>
    <div class="assessment-container">
        <!-- 顶部标题区 -->
        <div class="header-section">
            <div class="header-content">
                <div class="title-wrap">
                    <div class="header-icon">📋</div>
                    <div>
                        <h1>心理测评</h1>
                        <p class="subtitle">标准化的自我筛查工具，帮你更了解此刻的自己</p>
                    </div>
                </div>
                <el-button v-if="step !== 'list'" @click="backToList">
                    <el-icon><Back /></el-icon>
                    返回量表
                </el-button>
            </div>
        </div>

        <div class="content">
            <!-- 第一步：量表列表 -->
            <template v-if="step === 'list'">
                <div class="scale-grid">
                    <div v-for="s in scaleList" :key="s.code" class="scale-card" @click="startQuiz(s.code)">
                        <div class="scale-icon">{{ scaleIcon(s.code) }}</div>
                        <div class="scale-body">
                            <div class="scale-name">{{ s.name }}</div>
                            <p class="scale-desc">{{ s.description }}</p>
                            <div class="scale-meta">
                                <el-tag size="small" effect="plain">{{ s.questionCount }} 道题</el-tag>
                                <span class="meta-text">约 {{ s.durationMinutes }} 分钟</span>
                            </div>
                        </div>
                        <div class="scale-go">开始测评 →</div>
                    </div>
                </div>

                <div class="notice-card">
                    <el-icon><InfoFilled /></el-icon>
                    <span>测评结果仅用于自我觉察，不构成医学诊断。如结果提示需要关注，请结合专业人士的意见。</span>
                </div>

                <!-- 历史记录 -->
                <div class="card" v-if="recordList.length > 0">
                    <div class="section-title">我的测评历史</div>
                    <div class="record-list">
                        <div v-for="r in recordList" :key="r.id" class="record-item">
                            <div class="record-dot" :style="{ background: levelColor(r.levelIndex) }"></div>
                            <div class="record-body">
                                <div class="record-name">{{ r.scaleName }}</div>
                                <div class="record-level" :style="{ color: levelColor(r.levelIndex) }">{{ r.level }}</div>
                            </div>
                            <div class="record-right">
                                <div class="record-score">{{ r.totalScore }} 分</div>
                                <div class="record-time">{{ r.completedAt }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- 第二步：答题 -->
            <div class="card quiz-card" v-if="step === 'quiz' && currentScale">
                <div class="quiz-header">
                    <div class="quiz-name">{{ currentScale.name }}</div>
                    <div class="quiz-progress-text">
                        第 {{ currentIndex + 1 }} / {{ currentScale.questions.length }} 题
                    </div>
                </div>
                <el-progress
                    :percentage="((currentIndex + 1) / currentScale.questions.length) * 100"
                    :stroke-width="8"
                    color="#7ED321"
                />

                <div class="question-area" :key="currentIndex">
                    <p class="question-text">
                        {{ currentScale.questions[currentIndex].text }}
                    </p>
                    <p class="question-hint" v-if="currentIndex === 0">{{ currentScale.instruction }}</p>

                    <div class="option-list">
                        <div
                            v-for="opt in currentScale.options"
                            :key="opt.score"
                            class="option-item"
                            :class="{ selected: answers[currentIndex] === opt.score }"
                            @click="chooseOption(opt.score)"
                        >
                            <span class="option-radio"></span>
                            <span class="option-label">{{ opt.label }}</span>
                        </div>
                    </div>
                </div>

                <div class="quiz-actions">
                    <el-button :disabled="currentIndex === 0" @click="prevQuestion">上一题</el-button>
                    <el-button
                        v-if="currentIndex < currentScale.questions.length - 1"
                        type="primary"
                        :disabled="answers[currentIndex] == null"
                        @click="nextQuestion"
                    >
                        下一题
                    </el-button>
                    <el-button
                        v-else
                        type="success"
                        :disabled="!allAnswered || submitting"
                        :loading="submitting"
                        @click="handleSubmit"
                    >
                        提交测评
                    </el-button>
                </div>
            </div>

            <!-- 第三步：结果报告 -->
            <div class="result-area" v-if="step === 'result' && result">
                <div class="card report-card" :class="{ help: result.helpMode }">
                    <div class="report-header">
                        <div class="report-scale-name">{{ result.record.scaleName }}</div>
                        <div class="report-time">{{ result.record.completedAt }}</div>
                    </div>

                    <div class="score-section">
                        <div class="score-circle" :style="{ '--ring-color': result.level.color }">
                            <div class="score-num">{{ result.record.totalScore }}</div>
                            <div class="score-range">/ {{ result.scoreRange.max }} 分</div>
                        </div>
                        <div class="level-block">
                            <div class="level-tag" :style="{ background: result.level.color }">
                                {{ result.record.level }}
                            </div>
                            <div class="level-scale">
                                分级区间：{{ result.level.min }}-{{ result.level.max }} 分
                            </div>
                        </div>
                    </div>

                    <!-- 关键题预警 -->
                    <div class="critical-card" v-if="result.criticalHit">
                        <el-icon><WarnTriangleFilled /></el-icon>
                        <div>
                            <div class="critical-title">需要你特别关注的信号</div>
                            <p>{{ result.criticalTip }}</p>
                        </div>
                    </div>

                    <!-- 建议 -->
                    <div class="advice-card">
                        <div class="section-title">
                            <el-icon><ChatLineSquare /></el-icon>
                            给你的建议
                        </div>
                        <p class="advice-text">{{ result.record.advice }}</p>
                    </div>

                    <!-- 高危热线 -->
                    <div class="help-card" v-if="result.helpMode && result.hotline">
                        <div class="help-title">如果你需要有人说说话</div>
                        <p class="help-message">{{ result.hotline.message }}</p>
                        <div class="hotline-list">
                            <div class="hotline-item">
                                <span>{{ result.hotline.title }}</span>
                                <strong>{{ result.hotline.phone }}</strong>
                            </div>
                            <div class="hotline-item">
                                <span>{{ result.hotline.backupTitle }}</span>
                                <strong>{{ result.hotline.backupPhone }}</strong>
                            </div>
                        </div>
                    </div>

                    <p class="disclaimer">{{ result.disclaimer }}</p>

                    <div class="report-actions">
                        <el-button @click="startQuiz(result.record.scaleCode)">再测一次</el-button>
                        <el-button type="primary" @click="goFirstAid">
                            <el-icon><FirstAidKit /></el-icon>
                            去情绪急救箱练一练
                        </el-button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
    Back, InfoFilled, WarnTriangleFilled, ChatLineSquare, FirstAidKit
} from '@element-plus/icons-vue'
import {
    getScaleList,
    getScaleDetail,
    submitAssessment,
    getAssessmentRecords
} from '@/api/frontend'

const router = useRouter()

const step = ref('list') // list | quiz | result
const scaleList = ref([])
const recordList = ref([])
const currentScale = ref(null)
const currentIndex = ref(0)
const answers = reactive([])
const submitting = ref(false)
const result = ref(null)

const allAnswered = computed(() =>
    currentScale.value && answers.length === currentScale.value.questions.length &&
    answers.every((a) => a != null)
)

const scaleIcon = (code) => {
    const map = { 'PHQ-9': '🌧️', 'GAD-7': '🌪️', 'PSS-10': '⚖️' }
    return map[code] || '📝'
}

const levelColor = (index) => {
    const colors = ['#65A30D', '#CA8A04', '#EA580C', '#DC2626', '#B91C1C']
    return colors[index] || '#9CA3AF'
}

// 加载量表和历史
const loadData = async () => {
    try {
        const [scales, records] = await Promise.all([
            getScaleList(),
            getAssessmentRecords({ pageNum: 1, pageSize: 10 }),
        ])
        scaleList.value = scales || []
        recordList.value = records?.records || []
    } catch (e) {
        ElMessage.error(e?.msg || e?.message || '加载失败')
    }
}

// 开始答题
const startQuiz = async (code) => {
    try {
        const detail = await getScaleDetail(code)
        currentScale.value = detail
        currentIndex.value = 0
        answers.splice(0, answers.length)
        detail.questions.forEach(() => answers.push(null))
        result.value = null
        step.value = 'quiz'
    } catch (e) {
        ElMessage.error(e?.msg || e?.message || '量表加载失败')
    }
}

const chooseOption = (score) => {
    answers[currentIndex.value] = score
    // 选完自动跳转下一题（最后一题不跳，留给用户确认提交）
    if (currentIndex.value < currentScale.value.questions.length - 1) {
        setTimeout(() => {
            currentIndex.value += 1
        }, 180)
    }
}

const prevQuestion = () => {
    if (currentIndex.value > 0) currentIndex.value -= 1
}

const nextQuestion = () => {
    if (currentIndex.value < currentScale.value.questions.length - 1) {
        currentIndex.value += 1
    }
}

// 提交
const handleSubmit = async () => {
    submitting.value = true
    try {
        const res = await submitAssessment({
            scaleCode: currentScale.value.code,
            answers: [...answers],
        })
        result.value = res
        step.value = 'result'
        window.scrollTo({ top: 0, behavior: 'smooth' })
        loadData()
    } catch (e) {
        ElMessage.error(e?.msg || e?.message || '提交失败，请稍后重试')
    } finally {
        submitting.value = false
    }
}

const backToList = () => {
    step.value = 'list'
    result.value = null
}

const goFirstAid = () => {
    router.push('/firstAidKit')
}

onMounted(() => {
    loadData()
})
</script>

<style lang="scss" scoped>
.assessment-container {
    background: linear-gradient(135deg, #fafbfc 0%, #f7f9fc 50%, #f2f6fa 100%);
    min-height: calc(100vh - 285px);

    .header-section {
        background: linear-gradient(135deg, #7c6ff0 0%, #4a90e2 100%);
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
                .header-icon { font-size: 42px; }
                h1 { font-size: 28px; font-weight: 600; margin: 0; }
                .subtitle { margin: 4px 0 0; font-size: 14px; opacity: 0.85; }
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
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 17px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 14px;
        .el-icon { color: #7c6ff0; }
    }

    /* 量表卡片 */
    .scale-grid {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-bottom: 18px;
        .scale-card {
            display: flex;
            align-items: center;
            gap: 18px;
            background: white;
            border-radius: 12px;
            padding: 22px;
            cursor: pointer;
            border: 2px solid transparent;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            transition: all 0.2s;
            &:hover {
                transform: translateY(-2px);
                border-color: #7c6ff0;
                box-shadow: 0 6px 16px rgba(124, 111, 240, 0.15);
                .scale-go { color: #6d5ce0; }
            }
            .scale-icon {
                width: 60px;
                height: 60px;
                border-radius: 12px;
                background: linear-gradient(135deg, #f3f0ff, #eef2ff);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 30px;
                flex-shrink: 0;
            }
            .scale-body {
                flex: 1;
                min-width: 0;
                .scale-name { font-size: 17px; font-weight: 600; color: #1f2937; margin-bottom: 6px; }
                .scale-desc {
                    margin: 0 0 8px;
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 1.5;
                }
                .scale-meta {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    .meta-text { font-size: 13px; color: #9ca3af; }
                }
            }
            .scale-go {
                font-size: 14px;
                color: #9ca3af;
                font-weight: 500;
                flex-shrink: 0;
            }
        }
    }

    .notice-card {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #f5f3ff;
        color: #6d5ce0;
        border-radius: 10px;
        padding: 14px 18px;
        margin-bottom: 20px;
        font-size: 13px;
        line-height: 1.6;
    }

    /* 历史 */
    .record-list {
        .record-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 13px 0;
            border-bottom: 1px solid #f3f4f6;
            &:last-child { border-bottom: none; }
            .record-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                flex-shrink: 0;
            }
            .record-body {
                flex: 1;
                .record-name { font-size: 14px; color: #374151; font-weight: 500; }
                .record-level { font-size: 13px; margin-top: 3px; font-weight: 500; }
            }
            .record-right {
                text-align: right;
                .record-score { font-size: 15px; font-weight: 700; color: #374151; }
                .record-time { font-size: 12px; color: #9ca3af; margin-top: 2px; }
            }
        }
    }

    /* 答题 */
    .quiz-card {
        .quiz-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 16px;
            .quiz-name { font-size: 18px; font-weight: 600; color: #1f2937; }
            .quiz-progress-text { font-size: 14px; color: #9ca3af; }
        }
        .question-area {
            margin-top: 32px;
            min-height: 260px;
            .question-text {
                font-size: 20px;
                font-weight: 600;
                color: #1f2937;
                line-height: 1.6;
                margin: 0 0 8px;
            }
            .question-hint {
                font-size: 13px;
                color: #9ca3af;
                margin: 0 0 24px;
            }
        }
        .option-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            .option-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 15px 18px;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.15s;
                &:hover { border-color: #a78bfa; background: #faf8ff; }
                &.selected {
                    border-color: #7c6ff0;
                    background: #f3f0ff;
                    .option-radio {
                        border-color: #7c6ff0;
                        background: #7c6ff0;
                        box-shadow: inset 0 0 0 4px white;
                    }
                }
                .option-radio {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    border: 2px solid #d1d5db;
                    flex-shrink: 0;
                    transition: all 0.15s;
                }
                .option-label { font-size: 15px; color: #374151; }
            }
        }
        .quiz-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 28px;
        }
    }

    /* 结果报告 */
    .report-card {
        &.help { border: 2px solid #fecaca; }
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 20px;
            .report-scale-name { font-size: 18px; font-weight: 600; color: #1f2937; }
            .report-time { font-size: 13px; color: #9ca3af; }
        }
        .score-section {
            display: flex;
            align-items: center;
            gap: 32px;
            padding: 24px;
            background: #faf8ff;
            border-radius: 12px;
            margin-bottom: 20px;
            .score-circle {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                border: 8px solid var(--ring-color);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: white;
                flex-shrink: 0;
                .score-num {
                    font-size: 38px;
                    font-weight: 700;
                    color: var(--ring-color);
                    line-height: 1;
                }
                .score-range { font-size: 13px; color: #9ca3af; margin-top: 4px; }
            }
            .level-block {
                .level-tag {
                    display: inline-block;
                    color: white;
                    font-size: 17px;
                    font-weight: 600;
                    padding: 8px 20px;
                    border-radius: 20px;
                    margin-bottom: 10px;
                }
                .level-scale { font-size: 14px; color: #6b7280; }
            }
        }
        .critical-card {
            display: flex;
            gap: 12px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 10px;
            padding: 16px 18px;
            margin-bottom: 18px;
            color: #b91c1c;
            .el-icon { font-size: 22px; margin-top: 2px; flex-shrink: 0; }
            .critical-title { font-weight: 700; font-size: 15px; margin-bottom: 6px; }
            p { margin: 0; font-size: 14px; line-height: 1.6; }
        }
        .advice-card {
            background: #f9fafb;
            border-radius: 10px;
            padding: 18px 20px;
            margin-bottom: 18px;
            .advice-text {
                margin: 0;
                font-size: 15px;
                color: #4b5563;
                line-height: 1.8;
            }
        }
        .help-card {
            background: linear-gradient(135deg, #fff7ed, #ffedd5);
            border: 1px solid #fdba74;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 18px;
            .help-title { font-size: 16px; font-weight: 700; color: #9a3412; margin-bottom: 8px; }
            .help-message { margin: 0 0 14px; color: #7c2d12; font-size: 14px; line-height: 1.7; }
            .hotline-list {
                display: flex;
                gap: 14px;
                flex-wrap: wrap;
                .hotline-item {
                    background: white;
                    border-radius: 10px;
                    padding: 12px 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    span { font-size: 13px; color: #6b7280; }
                    strong { font-size: 20px; color: #ea580c; }
                }
            }
        }
        .disclaimer {
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
            margin: 0 0 20px;
        }
        .report-actions {
            display: flex;
            justify-content: center;
            gap: 12px;
        }
    }
}
</style>
