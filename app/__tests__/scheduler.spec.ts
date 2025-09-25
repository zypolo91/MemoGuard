import { describe, expect, it } from "vitest";

import { getUpcomingReminders } from "@/services/scheduler";
import type { CareTask } from "@/stores/tasks";

describe("scheduler", () => {
  it("computes upcoming reminders ordered by trigger time", () => {
    const now = new Date();
    const tasks: CareTask[] = [
      {
        id: "task-1",
        title: "服药提醒",
        category: "用药",
        frequency: "daily",
        startAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        endAt: null,
        priority: "high",
        reminderLead: 15,
        reminderChannel: ["app"],
        notes: "",
        statusHistory: []
      },
      {
        id: "task-2",
        title: "散步陪伴",
        category: "陪伴",
        frequency: "daily",
        startAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        endAt: null,
        priority: "medium",
        reminderLead: 30,
        reminderChannel: ["sms"],
        notes: "",
        statusHistory: []
      }
    ];

    const reminders = getUpcomingReminders(tasks, 2);

    expect(reminders).toHaveLength(2);
    expect(new Date(reminders[0]?.triggerAt).getTime()).toBeLessThan(
      new Date(reminders[1]?.triggerAt).getTime()
    );
    expect(reminders[0]?.title).toBe("服药提醒");
  });
});
