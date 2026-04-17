import { z } from "zod";

export const taskCreateSchema = z.object({
  title:       z.string().min(1, "العنوان مطلوب").max(300),
  description: z.string().max(1000).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
});

export const taskUpdateSchema = z.object({
  title:       z.string().min(1).max(300).optional(),
  description: z.string().max(1000).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  done:        z.boolean().optional(),
});

export type TaskCreate = z.infer<typeof taskCreateSchema>;
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;
