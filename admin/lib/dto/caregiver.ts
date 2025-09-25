import { z } from "zod";

export const caregiverUpdateSchema = z.object({
  fullName: z.string().max(120).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional(),
  streak: z.string().optional(),
  preferences: z
    .object({
      notificationDailyDigest: z.boolean().optional(),
      notificationNews: z.boolean().optional(),
      notificationTasks: z.boolean().optional(),
      language: z.string().optional(),
      theme: z.string().optional(),
      followedTopics: z.array(z.string()).optional()
    })
    .optional()
});

export type CaregiverUpdatePayload = z.infer<typeof caregiverUpdateSchema>;
