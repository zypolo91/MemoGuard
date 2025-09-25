import { boolean, integer, interval, jsonb, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "completed", "skipped"]);

export const careTasks = pgTable("care_tasks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  frequency: varchar("frequency", { length: 32 }),
  dueAt: timestamp("due_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  streak: integer("streak").default(0).notNull()
});

export const taskReminders = pgTable("task_reminders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  taskId: varchar("task_id", { length: 36 }).notNull().references(() => careTasks.id, { onDelete: "cascade" }),
  status: taskStatusEnum("status").default("pending").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  notes: text("notes")
});

export const taskHistory = pgTable("task_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  taskId: varchar("task_id", { length: 36 }).notNull().references(() => careTasks.id, { onDelete: "cascade" }),
  status: taskStatusEnum("status").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>()
});

export const careTasksRelations = relations(careTasks, ({ many }) => ({
  reminders: many(taskReminders),
  history: many(taskHistory)
}));

export const taskRemindersRelations = relations(taskReminders, ({ one }) => ({
  task: one(careTasks, {
    fields: [taskReminders.taskId],
    references: [careTasks.id]
  })
}));

export const taskHistoryRelations = relations(taskHistory, ({ one }) => ({
  task: one(careTasks, {
    fields: [taskHistory.taskId],
    references: [careTasks.id]
  })
}));
