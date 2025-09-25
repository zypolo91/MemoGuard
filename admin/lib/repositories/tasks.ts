import { and, eq } from "drizzle-orm";
import { careTasks, taskReminders, taskHistory } from "../schema/tasks";
import { getDb } from "../utils/db";
import { createId } from "../utils/id";
import type { ReminderPayload, TaskPayload, TaskUpdatePayload } from "../dto/tasks";

export async function listTasks() {
  const db = getDb();
  return db.query.careTasks.findMany({
    with: {
      reminders: true,
      history: true
    },
    orderBy: (fields, { desc }) => desc(fields.createdAt)
  });
}

export async function createTask(payload: TaskPayload) {
  const db = getDb();
  const id = createId();
  await db.insert(careTasks).values({
    id,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    frequency: payload.frequency,
    dueAt: payload.dueAt ?? null
  });
  return getTask(id);
}

export async function updateTask(id: string, payload: TaskUpdatePayload) {
  const db = getDb();
  await db
    .update(careTasks)
    .set({
      ...(payload.title !== undefined && { title: payload.title }),
      ...(payload.description !== undefined && { description: payload.description }),
      ...(payload.priority !== undefined && { priority: payload.priority }),
      ...(payload.frequency !== undefined && { frequency: payload.frequency }),
      ...(payload.dueAt !== undefined && { dueAt: payload.dueAt })
    })
    .where(eq(careTasks.id, id));
  return getTask(id);
}

export async function deleteTask(id: string) {
  const db = getDb();
  await db.delete(careTasks).where(eq(careTasks.id, id));
}

export async function getTask(id: string) {
  const db = getDb();
  const task = await db.query.careTasks.findFirst({
    with: {
      reminders: true,
      history: true
    },
    where: (fields, operators) => operators.eq(fields.id, id)
  });
  return task ?? null;
}

export async function addReminder(taskId: string, payload: ReminderPayload) {
  const db = getDb();
  await db.insert(taskReminders).values({
    id: createId(),
    taskId,
    status: payload.status,
    timestamp: payload.timestamp,
    notes: payload.notes
  });
  return getTask(taskId);
}

export async function updateReminder(taskId: string, timestamp: string, payload: Partial<ReminderPayload>) {
  const db = getDb();
  await db
    .update(taskReminders)
    .set({
      ...(payload.status !== undefined && { status: payload.status }),
      ...(payload.timestamp !== undefined && { timestamp: payload.timestamp }),
      ...(payload.notes !== undefined && { notes: payload.notes })
    })
    .where(and(eq(taskReminders.taskId, taskId), eq(taskReminders.timestamp, timestamp)));
  return getTask(taskId);
}

export async function deleteReminder(taskId: string, timestamp: string) {
  const db = getDb();
  await db.delete(taskReminders).where(and(eq(taskReminders.taskId, taskId), eq(taskReminders.timestamp, timestamp)));
  return getTask(taskId);
}
