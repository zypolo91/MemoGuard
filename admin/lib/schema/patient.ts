import { boolean, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const assessmentMetricEnum = pgEnum("assessment_metric", ["tau", "amyloid", "metabolism", "cognition", "score"]);
export const assessmentStatusEnum = pgEnum("assessment_status", ["stable", "improving", "declining", "critical"]);

export const assessmentTemplates = pgTable("assessment_templates", {
  id: varchar("id", { length: 48 }).primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description"),
  metric: assessmentMetricEnum("metric").notNull(),
  defaultUnit: varchar("default_unit", { length: 24 }),
  lowerBound: numeric("lower_bound", { precision: 12, scale: 4 }),
  upperBound: numeric("upper_bound", { precision: 12, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const patientProfile = pgTable("patient_profile", {
  id: varchar("id", { length: 36 }).primaryKey(),
  fullName: varchar("full_name", { length: 120 }).notNull(),
  avatarUrl: text("avatar_url"),
  birthDate: timestamp("birth_date", { withTimezone: false }),
  diagnosis: varchar("diagnosis", { length: 160 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const patientAssessments = pgTable("patient_assessments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patientProfile.id, { onDelete: "cascade" }),
  templateId: varchar("template_id", { length: 48 }).notNull().references(() => assessmentTemplates.id),
  label: varchar("label", { length: 120 }),
  metric: assessmentMetricEnum("metric").notNull(),
  value: numeric("value", { precision: 12, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 24 }),
  status: assessmentStatusEnum("status").default("stable").notNull(),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at", { withTimezone: false }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const assessmentTemplatesRelations = relations(assessmentTemplates, ({ many }) => ({
  assessments: many(patientAssessments)
}));

export const patientProfileRelations = relations(patientProfile, ({ many }) => ({
  assessments: many(patientAssessments)
}));

export const patientAssessmentsRelations = relations(patientAssessments, ({ one }) => ({
  patient: one(patientProfile, {
    fields: [patientAssessments.patientId],
    references: [patientProfile.id]
  }),
  template: one(assessmentTemplates, {
    fields: [patientAssessments.templateId],
    references: [assessmentTemplates.id]
  })
}));
