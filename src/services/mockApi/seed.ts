export const seedMemories = [
  {
    id: "m-001",
    title: "第一次温泉旅行",
    content: "在山谷中的温泉旅馆，妈妈记起了小时候最爱的木鱼声。",
    media: [
      {
        id: "m-001-photo-1",
        type: "image" as const,
        url: "/media/m-001-1.jpg",
        thumbnail: "/media/m-001-thumb.jpg",
        transcript: null
      }
    ],
    createdAt: "2025-09-10T09:30:00+08:00",
    eventDate: "2025-09-08",
    people: ["妈妈", "我"],
    tags: ["家庭", "旅行"],
    mood: "温馨",
    location: "箱根",
    annotations: [
      {
        id: "ma-001",
        type: "note" as const,
        targetId: "m-001-photo-1",
        timestamp: 23,
        body: "妈妈主动提到爷爷的小店，这是近期少见的回忆。",
        createdBy: "我"
      }
    ]
  }
];

export const seedTasks = [
  {
    id: "t-001",
    title: "上午服用胆碱片",
    category: "用药",
    frequency: "daily",
    startAt: "2025-09-01T08:00:00+08:00",
    endAt: null,
    priority: "high",
    reminderLead: 15,
    reminderChannel: ["app"],
    notes: "早餐后 30 分钟内服用",
    statusHistory: [
      {
        status: "completed",
        timestamp: "2025-09-20T08:15:00+08:00"
      }
    ]
  }
];

export const seedNews = [
  {
    id: "n-001",
    title: "新研究：适度运动延缓轻度认知障碍",
    source: "Nature Aging",
    summary: "每周 150 分钟的中等强度运动可提升执行功能，并减缓 MCI 进程。",
    publishedAt: "2025-08-25T10:00:00+08:00",
    topics: ["运动", "认知障碍"],
    url: "https://example.com/research/mci-exercise",
    highlight: "研究建议结合音乐律动提高依从性",
    isBookmarked: false
  }
];

export const seedProfile = {
  id: "u-001",
  name: "林沐",
  role: "家庭照护者",
  avatar: "/media/avatar.png",
  streak: 12,
  careFocus: ["记忆训练", "饮食规划"],
  preferences: {
    notification: {
      dailyDigest: true,
      news: true,
      tasks: true
    },
    language: "zh-CN",
    theme: "auto"
  },
  followedTopics: ["认知训练", "营养补充", "音乐疗法"]
};

export const seedPatientProfile = {
  id: "patient-001",
  name: "李慧敏",
  gender: "女",
  age: 72,
  birthDate: "1953-04-18",
  diagnosisDate: "2023-06-12",
  caregiver: "张伟（家属）",
  contactPhone: "138-0000-1234",
  address: "上海市浦东新区",
  medications: ["多奈哌齐 5mg 每日一次", "褪黑素 2mg 睡前服用"],
  notes: "夜间偶有迷路，与家属共同进行记忆训练。"
};

export const seedPatientAssessments = [
  {
    id: "assess-20230318",
    date: "2023-03-18",
    templateId: "cognitive-moca",
    label: "MoCA",
    metric: "score",
    value: 20,
    unit: "分",
    status: "轻度认知下降",
    notes: "执行功能稍弱，建议继续训练。"
  },
  {
    id: "assess-20230922",
    date: "2023-09-22",
    templateId: "pet-amyloid",
    label: "Amyloid PET",
    metric: "amyloid",
    value: 1.42,
    unit: "SUVR",
    status: "淀粉样蛋白明显沉积",
    notes: "顶叶与颞叶摄取增高。"
  },
  {
    id: "assess-20240305",
    date: "2024-03-05",
    templateId: "cognitive-moca",
    label: "MoCA",
    metric: "score",
    value: 18.5,
    unit: "分",
    status: "持续下降需干预",
    notes: "注意力波动，建议增加日间活动。"
  },
  {
    id: "assess-20240830",
    date: "2024-08-30",
    templateId: "pet-tau",
    label: "PET Tau",
    metric: "tau",
    value: 1.28,
    unit: "SUVR",
    status: "海马区 tau 聚集增加",
    notes: "左侧海马强化明显。"
  }
];

