import { z } from "zod";

export const customerCreateSchema = z.object({
  name:    z.string().min(1, "الاسم مطلوب").max(200),
  phone:   z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "") ? undefined : v,
    z.string().max(30).optional()
  ),
  address: z.string().max(500).optional(),
  note:    z.string().max(1000).optional(),
});

export const customerUpdateSchema = customerCreateSchema.partial();

export type CustomerCreate = z.infer<typeof customerCreateSchema>;
export type CustomerUpdate = z.infer<typeof customerUpdateSchema>;
