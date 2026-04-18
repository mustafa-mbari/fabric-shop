import { z } from "zod";

export const debtCreateSchema = z.object({
  customer_id:  z.string().uuid("يجب اختيار عميل"),
  type:         z.enum(["WHOLESALE", "RETAIL"]),
  amount_total: z
    .number()
    .int("المبلغ يجب أن يكون عدداً صحيحاً")
    .positive("المبلغ يجب أن يكون أكبر من صفر")
    .multipleOf(250, "المبلغ يجب أن يكون مضاعفاً لـ 250"),
  note:     z.string().max(1000).optional(),
  order_id: z.string().uuid().nullable().optional(),
});

export const debtUpdateSchema = z.object({
  note: z.string().max(1000).optional(),
});

export const debtAddAmountSchema = z.object({
  amount: z
    .number()
    .int("المبلغ يجب أن يكون عدداً صحيحاً")
    .positive("المبلغ يجب أن يكون أكبر من صفر")
    .multipleOf(250, "المبلغ يجب أن يكون مضاعفاً لـ 250"),
  note: z.string().max(500).optional(),
});

export const paymentCreateSchema = z.object({
  amount: z
    .number()
    .int("المبلغ يجب أن يكون عدداً صحيحاً")
    .positive("المبلغ يجب أن يكون أكبر من صفر")
    .multipleOf(250, "المبلغ يجب أن يكون مضاعفاً لـ 250"),
  note: z.string().max(500).optional(),
});

export type DebtCreate    = z.infer<typeof debtCreateSchema>;
export type DebtUpdate    = z.infer<typeof debtUpdateSchema>;
export type DebtAddAmount = z.infer<typeof debtAddAmountSchema>;
export type PaymentCreate = z.infer<typeof paymentCreateSchema>;
