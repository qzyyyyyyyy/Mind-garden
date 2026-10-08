// 心理测评量表 seed 脚本（PHQ-9 / GAD-7 / PSS-10）
// 执行：node prisma/seed-scales.mjs（幂等，可重复执行）
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PHQ-9 / GAD-7 通用频率选项（0-3 分）
const FREQUENCY_OPTIONS_03 = [
  { score: 0, label: '完全不会' },
  { score: 1, label: '有几天' },
  { score: 2, label: '一半以上天数' },
  { score: 3, label: '几乎每天' },
];

// PSS-10 频率选项（0-4 分）
const FREQUENCY_OPTIONS_04 = [
  { score: 0, label: '从不' },
  { score: 1, label: '偶尔' },
  { score: 2, label: '经常' },
  { score: 3, label: '频繁' },
  { score: 4, label: '总是' },
];

const SCALES = [
  {
    code: 'PHQ-9',
    name: '抑郁情绪筛查（PHQ-9）',
    description: '国际通用的抑郁情绪筛查量表，帮助你了解近两周的情绪状态，约 3 分钟。',
    instruction: '请根据过去两周内，以下情况困扰你的频率进行作答。凭第一感觉选择即可，没有对错之分。',
    durationMinutes: 3,
    sortOrder: 1,
    options: FREQUENCY_OPTIONS_03,
    questions: [
      { key: 1, text: '做事时提不起劲或没有兴趣' },
      { key: 2, text: '感到心情低落、沮丧或绝望' },
      { key: 3, text: '入睡困难、睡不安稳，或睡眠过多' },
      { key: 4, text: '感觉疲倦，或没有活力' },
      { key: 5, text: '食欲不振，或吃得太多' },
      { key: 6, text: '觉得自己很糟，或觉得自己很失败，或让自己/家人失望' },
      { key: 7, text: '对事物难以专注，例如看书、刷手机时' },
      { key: 8, text: '动作或说话缓慢到别人能察觉，或相反地烦躁、坐立不安' },
      {
        key: 9,
        text: '有“不如死掉”或用某种方式伤害自己的念头',
        critical: true,
        criticalScore: 1,
        criticalTip: '你在“伤害自己的念头”一题上选择了非“完全不会”，请一定认真对待这个信号。',
      },
    ],
    levels: [
      { index: 0, min: 0, max: 4, label: '无明显抑郁症状', color: '#65A30D', advice: '你的情绪状态总体平稳。继续保持规律作息、适度运动和与朋友的联结，情绪日记也能帮你持续自我觉察。' },
      { index: 1, min: 5, max: 9, label: '轻度抑郁倾向', color: '#CA8A04', advice: '最近可能有些低落。可以试试情绪急救箱中的呼吸与书写练习，多安排一些能带来愉悦感的小事，并保持记录情绪日记。' },
      { index: 2, min: 10, max: 14, label: '中度抑郁倾向', color: '#EA580C', advice: '这段时间你可能过得比较辛苦。建议坚持自助练习、减少过度压力源，并考虑向信任的人或学校心理辅导中心倾诉。' },
      { index: 3, min: 15, max: 19, label: '中重度抑郁倾向', color: '#DC2626', helpMode: true, advice: '测评结果提示需要重点关注。建议尽快预约学校心理辅导或专业心理科门诊进行评估，不必独自硬撑。' },
      { index: 4, min: 20, max: 27, label: '重度抑郁倾向', color: '#B91C1C', helpMode: true, advice: '请认真对待此刻的状态：建议尽快在家人或朋友的陪伴下前往专业医疗机构，或先拨打心理援助热线获得即时支持。' },
    ],
  },
  {
    code: 'GAD-7',
    name: '焦虑情绪筛查（GAD-7）',
    description: '国际通用的广泛性焦虑筛查量表，了解近两周的焦虑水平，约 2 分钟。',
    instruction: '请根据过去两周内，以下情况出现的频率进行作答，凭真实感受选择即可。',
    durationMinutes: 2,
    sortOrder: 2,
    options: FREQUENCY_OPTIONS_03,
    questions: [
      { key: 1, text: '感到紧张、焦虑或急躁' },
      { key: 2, text: '不能停止或控制担忧' },
      { key: 3, text: '对各种各样的事情担忧过多' },
      { key: 4, text: '很难放松下来' },
      { key: 5, text: '烦躁不安，以至于难以静坐' },
      { key: 6, text: '变得容易烦恼或急躁' },
      { key: 7, text: '感到害怕，似乎将有可怕的事情发生' },
    ],
    levels: [
      { index: 0, min: 0, max: 4, label: '无明显焦虑症状', color: '#65A30D', advice: '你目前的焦虑水平较低。继续保持当下的调节节奏，也可以把有效的方法记录下来。' },
      { index: 1, min: 5, max: 9, label: '轻度焦虑倾向', color: '#CA8A04', advice: '有些轻微的紧张感。可以试试箱式呼吸、5-4-3-2-1 感官着陆等练习，帮助注意力回到当下。' },
      { index: 2, min: 10, max: 14, label: '中度焦虑倾向', color: '#EA580C', advice: '焦虑可能已经影响到日常状态。建议拆解让你担忧的事情、用“证据检验法”梳理想法，并减少咖啡因、保证睡眠。' },
      { index: 3, min: 15, max: 21, label: '重度焦虑倾向', color: '#DC2626', helpMode: true, advice: '强烈的焦虑值得被认真对待。建议尽快联系学校心理辅导中心或专业心理科门诊，学习系统的应对方法。' },
    ],
  },
  {
    code: 'PSS-10',
    name: '压力感知测评（PSS-10）',
    description: '经典压力知觉量表，评估近一个月你感受到的生活压力与掌控感，约 3 分钟。',
    instruction: '请根据近一个月的真实情况选择频率。注意：部分题目表述为“积极感受”，系统会自动进行反向计分。',
    durationMinutes: 3,
    sortOrder: 3,
    options: FREQUENCY_OPTIONS_04,
    questions: [
      { key: 1, text: '因发生意外之事而感到心烦意乱' },
      { key: 2, text: '感觉无法控制生活中重要的事情' },
      { key: 3, text: '感到紧张和有压力' },
      { key: 4, text: '对自己处理个人问题的能力感到有信心', reverse: true },
      { key: 5, text: '感到事情正朝着自己期望的方向发展', reverse: true },
      { key: 6, text: '发现自己无法应付所有必须要做的事情' },
      { key: 7, text: '能够控制生活中令自己恼怒的事情', reverse: true },
      { key: 8, text: '感觉自己能掌控好一切', reverse: true },
      { key: 9, text: '因无法控制的事情而生气' },
      { key: 10, text: '感到困难堆积如山，自己无法克服' },
    ],
    levels: [
      { index: 0, min: 0, max: 13, label: '压力水平较低', color: '#65A30D', advice: '你对生活有较好的掌控感。保持现有的节奏和支持系统，也别忘了适时休息。' },
      { index: 1, min: 14, max: 19, label: '中等压力', color: '#CA8A04', advice: '生活中有一定压力，尚在可调节范围。试试为任务排优先级、安排固定的放松时间，并坚持情绪记录。' },
      { index: 2, min: 20, max: 26, label: '压力较高', color: '#EA580C', advice: '压力已经比较明显。建议主动减少不必要的负荷，保证睡眠和运动，多与信任的人交流，必要时寻求辅导支持。' },
      { index: 3, min: 27, max: 40, label: '压力很高', color: '#DC2626', advice: '你可能正承受很大的压力负荷。请不要独自承担，建议尽快向家人、老师、学校心理辅导中心或专业机构寻求帮助。' },
    ],
  },
];

try {
  for (const s of SCALES) {
    await prisma.psychologicalScale.upsert({
      where: { code: s.code },
      create: s,
      update: {
        name: s.name,
        description: s.description,
        instruction: s.instruction,
        questions: s.questions,
        options: s.options,
        levels: s.levels,
        durationMinutes: s.durationMinutes,
        sortOrder: s.sortOrder,
      },
    });
  }
  const count = await prisma.psychologicalScale.count();
  console.log(`seed 完成，量表库共 ${count} 个量表`);
} catch (e) {
  console.error('SEED_ERROR:', e.message);
} finally {
  await prisma.$disconnect();
}
process.exit(0);
