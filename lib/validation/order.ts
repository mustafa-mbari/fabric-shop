import { z } from "zod";

export const orderItemSchema = z.object({
  product_name:   z.string().min(1, "اسم المنتج مطلوب"),
  quantity:       z.number().positive("الكمية يجب أن تكون أكبر من 0"),
  price_per_unit: z
    .number()
    .int("السعر يجب أن يكون عدداً صحيحاً")
    .nonnegative("السعر يجب أن يكون 0 أو أكثر")
    .multipleOf(250, "السعر يجب أن يكون مضاعفاً لـ 250"),
});

export const orderCreateSchema = z.object({
  customer_id:    z.string().uuid().nullable().optional(),
  customer_name:  z.string().max(200).optional(),
  status:         z.enum(["NEW", "IN_PROGRESS", "ON_HOLD", "READY", "DELIVERED"]).default("NEW"),
  notes:          z.string().max(1000).optional(),
  delivery_date:  z.string().optional(),   // ISO date string YYYY-MM-DD
  items:          z.array(orderItemSchema).min(1, "يجب إضافة منتج واحد على الأقل"),
}).refine(
  (d) => d.customer_id != null || (d.customer_name && d.customer_name.trim().length > 0),
  { message: "يجب اختيار عميل أو إدخال اسم العميل", path: ["customer_name"] },
);

export const orderUpdateSchema = z.object({
  customer_id:    z.string().uuid().nullable().optional(),
  customer_name:  z.string().max(200).optional(),
  status:         z.enum(["NEW", "IN_PROGRESS", "ON_HOLD", "READY", "DELIVERED"]).optional(),
  notes:          z.string().max(1000).optional(),
  delivery_date:  z.string().optional(),
  items:          z.array(orderItemSchema).min(1, "يجب إضافة منتج واحد على الأقل").optional(),
});

export type OrderItem   = z.infer<typeof orderItemSchema>;
export type OrderCreate = z.infer<typeof orderCreateSchema>;
export type OrderUpdate = z.infer<typeof orderUpdateSchema>;
