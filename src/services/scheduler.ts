import type { CareTask } from "@/stores/tasks";

export interface ReminderSlot {
  id: string;
  title: string;
  triggerAt: string;
  channel: string;
}

export function getUpcomingReminders(tasks: CareTask[], limit = 3): ReminderSlot[] {
  const now = new Date();
  return tasks
    .flatMap((task) => {
      const start = new Date(task.startAt);
      const trigger = new Date(start.getTime() - task.reminderLead * 60 * 1000);
      if (trigger < now) {
        trigger.setDate(trigger.getDate() + 1);
      }
      return {
        id: `${task.id}-${trigger.toISOString()}`,
        title: task.title,
        triggerAt: trigger.toISOString(),
        channel: task.reminderChannel[0] ?? "app"
      };
    })
    .sort((a, b) => new Date(a.triggerAt).getTime() - new Date(b.triggerAt).getTime())
    .slice(0, limit);
}

export function formatReminder(reminder: ReminderSlot) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(reminder.triggerAt));
}
