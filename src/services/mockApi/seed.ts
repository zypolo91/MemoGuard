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

export const seedRecipes = [
  {
    id: "r-001",
    title: "银杏核桃燕麦碗",
    description: "富含 Omega-3 与抗氧化成分的活力早餐。",
    tags: ["早餐", "脑健康"],
    prepTime: 10,
    cookTime: 5,
    difficulty: "easy",
    heroImage: "/media/r-001.jpg",
    ingredients: [
      { name: "燕麦片", quantity: 50, unit: "g" },
      { name: "核桃", quantity: 20, unit: "g" },
      { name: "银杏果", quantity: 10, unit: "颗" }
    ],
    steps: ["燕麦片加热牛奶煮三分钟", "加入处理好的银杏果和核桃", "撒上蓝莓与蜂蜜即可"],
    nutrition: {
      calories: 360,
      protein: 12,
      fat: 14,
      carbs: 46,
      vitamins: {
        b12: 0.4,
        e: 2.3,
        omega3: 1.5,
        antioxidants: 420
      }
    },
    pairings: ["黑咖啡", "柠檬水"],
    isBookmarked: true
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
