import { z } from "zod";

export const productCreateSchema = z.object({
  name:        z.string().min(1, "الاسم مطلوب").max(300),
  type:        z.enum(["METER", "UNIT"]),
  quantity:    z.number().nonnegative("الكمية يجب أن تكون 0 أو أكثر"),
  description: z.string().max(1000).optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const quantityAdjustSchema = z.object({
  quantity: z.number().nonnegative("الكمية يجب أن تكون 0 أو أكثر"),
});

export type ProductCreate = z.infer<typeof productCreateSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
