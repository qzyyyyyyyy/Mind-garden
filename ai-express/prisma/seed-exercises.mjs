// 情绪急救箱练习库 seed 脚本
// 执行：node prisma/seed-exercises.mjs
// 幂等：按 name upsert，可重复执行
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EXERCISES = [
  // 呼吸调节
  {
    name: '4-7-8 呼吸法',
    category: '呼吸调节',
    description: '通过延长呼气激活副交感神经，快速平复焦虑与紧张。',
    steps: [
      '用鼻子轻轻吸气，心里默数 4 拍',
      '屏住呼吸，默数 7 拍',
      '用嘴巴缓缓呼气，默数 8 拍，想象紧张随气流离开',
      '重复 4-6 轮，节奏尽量均匀',
    ],
    durationMinutes: 4,
    suitableEmotions: ['焦虑', '困惑', '惊讶'],
    icon: '🫁',
    sortOrder: 1,
  },
  {
    name: '箱式呼吸',
    category: '呼吸调节',
    description: '吸气-屏息-呼气-屏息各 4 拍，像画一个正方形，让注意力回到当下。',
    steps: [
      '吸气 4 拍，想象沿正方形左边向上',
      '屏息 4 拍，沿上边向右',
      '缓慢呼气 4 拍，沿右边向下',
      '屏息 4 拍，沿下边向左，回到起点',
      '重复 5-8 轮',
    ],
    durationMinutes: 4,
    suitableEmotions: ['焦虑', '疲惫'],
    icon: '🫁',
    sortOrder: 2,
  },
  // 感官着陆
  {
    name: '5-4-3-2-1 感官着陆',
    category: '感官着陆',
    description: '用五感锚定当下，把被情绪卷走的注意力拉回来。',
    steps: [
      '说出你看到的 5 样东西（颜色、形状）',
      '触摸身边的 4 样东西，感受温度和质地',
      '倾听并说出 3 种环境声音',
      '找出 2 种你能闻到的气味',
      '说出 1 种你能尝到的味道，深呼吸一次',
    ],
    durationMinutes: 5,
    suitableEmotions: ['焦虑', '困惑', '惊讶'],
    icon: '🌍',
    sortOrder: 3,
  },
  {
    name: '身体扫描',
    category: '感官着陆',
    description: '从头到脚逐一觉察身体感受，释放紧绷，回到身体。',
    steps: [
      '找一个舒服的姿势坐下或躺下，闭上眼睛',
      '把注意力放在头顶和额头，观察那里的感觉',
      '缓慢下移：肩膀、胸口、腹部，觉察紧绷并放松',
      '继续到双腿和脚底，感受与地面的接触',
      '最后深呼吸一次，慢慢睁开眼睛',
    ],
    durationMinutes: 8,
    suitableEmotions: ['疲惫', '焦虑', '悲伤'],
    icon: '🌍',
    sortOrder: 4,
  },
  // 表达书写
  {
    name: '情绪命名练习',
    category: '表达书写',
    description: '给情绪起个名字，心理学上叫“情绪标注”，能有效降低情绪强度。',
    steps: [
      '写下现在最强烈的感受是什么（如：委屈、失落）',
      '它出现在身体的哪个部位？是什么感觉？',
      '它想提醒你什么？',
      '对它说一句话：“我看到你了，你可以在这里。”',
    ],
    durationMinutes: 5,
    suitableEmotions: ['悲伤', '困惑'],
    icon: '✍️',
    sortOrder: 5,
  },
  {
    name: '感恩三件事',
    category: '表达书写',
    description: '写下今天三件值得感谢的小事，把注意力从缺失转向拥有。',
    steps: [
      '写下今天发生的三件小事（再小都可以）',
      '为每件事补一句：它为什么让你觉得还不错',
      '读一遍自己写的内容，体会那种感觉',
    ],
    durationMinutes: 5,
    suitableEmotions: ['悲伤', '疲惫', '开心'],
    icon: '✍️',
    sortOrder: 6,
  },
  // 身体激活
  {
    name: '两分钟身体唤醒',
    category: '身体激活',
    description: '低能量时的迷你伸展，快速激活身体，赶走麻木感。',
    steps: [
      '站起来，双手向上伸展，深吸气，踮脚尖，保持 3 拍',
      '体侧弯腰左右各一次，感受侧腰拉伸',
      '转肩 10 圈，前后各 5 圈',
      '原地踏步 30 秒，手臂自然摆动',
      '喝一口水，感受身体被唤醒',
    ],
    durationMinutes: 2,
    suitableEmotions: ['疲惫', '悲伤'],
    icon: '💪',
    sortOrder: 7,
  },
  {
    name: '快走打卡',
    category: '身体激活',
    description: '到户外快走 10 分钟，运动是最被验证的情绪调节方式之一。',
    steps: [
      '换上舒适的鞋子，走出室内',
      '以比平常稍快的步速行走',
      '留意沿途的三样景物（树、云、行人）',
      '结束时留意身体的感觉：心跳、呼吸、温度',
    ],
    durationMinutes: 10,
    suitableEmotions: ['疲惫', '悲伤', '困惑'],
    icon: '💪',
    sortOrder: 8,
  },
  // 认知重构
  {
    name: '换个角度想',
    category: '认知重构',
    description: '像好朋友一样和自己对话，松动“钻牛角尖”的想法。',
    steps: [
      '写下脑中反复出现的那个念头',
      '问自己：如果好朋友遇到同样的事，我会对 TA 说什么？',
      '找出这个想法里“绝对化”的词（必须、永远、全部）',
      '写下一个更温和、更符合事实的替代想法',
    ],
    durationMinutes: 6,
    suitableEmotions: ['困惑', '悲伤', '焦虑'],
    icon: '🧠',
    sortOrder: 9,
  },
  {
    name: '证据检验法',
    category: '认知重构',
    description: '把担忧当成待检验的假设，用事实证据帮自己看清全貌。',
    steps: [
      '写下你担心的事情，例如“我肯定搞砸明天汇报”',
      '列出支持这个想法的证据（1-2 条即可）',
      '列出反对的证据：以往做成的经历、准备过什么',
      '写下一个更平衡的结论，如“我准备过，可能会紧张但能应对”',
    ],
    durationMinutes: 6,
    suitableEmotions: ['焦虑', '困惑'],
    icon: '🧠',
    sortOrder: 10,
  },
  // 睡前放松
  {
    name: '渐进式肌肉放松',
    category: '睡前放松',
    description: '先紧绷再放松各部位肌肉，用身体对比感释放压力。',
    steps: [
      '躺好，闭眼，深呼吸 3 次',
      '双手握拳 5 秒再松开，感受放松的对比',
      '依次对肩膀、面部、腹部、双腿做同样练习',
      '最后全身放松躺 1 分钟，感受沉重与安宁',
    ],
    durationMinutes: 10,
    suitableEmotions: ['疲惫', '焦虑'],
    icon: '🌙',
    sortOrder: 11,
  },
  {
    name: '睡前白噪音放松',
    category: '睡前放松',
    description: '用稳定的白噪音（雨声、海浪）盖过杂念，温和地滑入睡眠。',
    steps: [
      '调暗灯光，躺好，盖好被子',
      '播放雨声/海浪等白噪音，音量刚好能听到',
      '把注意力轻轻放在声音上，走神了也没关系，温和地拉回来',
      '跟随呼吸的节奏，慢慢入睡',
    ],
    durationMinutes: 15,
    suitableEmotions: ['疲惫', '焦虑', '悲伤'],
    icon: '🌙',
    sortOrder: 12,
  },
];

try {
  for (const ex of EXERCISES) {
    await prisma.emotionExercise.upsert({
      where: { name: ex.name },
      create: ex,
      update: {
        category: ex.category,
        description: ex.description,
        steps: ex.steps,
        durationMinutes: ex.durationMinutes,
        suitableEmotions: ex.suitableEmotions,
        icon: ex.icon,
        sortOrder: ex.sortOrder,
      },
    });
  }
  const count = await prisma.emotionExercise.count();
  console.log(`seed 完成，练习库共 ${count} 个练习`);
} catch (e) {
  console.error('SEED_ERROR:', e.message);
} finally {
  await prisma.$disconnect();
}
process.exit(0);
