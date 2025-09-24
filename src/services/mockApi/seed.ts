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

