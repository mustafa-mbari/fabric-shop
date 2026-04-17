// All money is whole IQD stored as bigint. Smallest denomination: 250 IQD.

const formatter = new Intl.NumberFormat("ar-IQ", {
  style: "currency",
  currency: "IQD",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** Format a bigint or number IQD amount for display. e.g. 123000n → "١٢٣٬٠٠٠ د.ع" */
export function formatMoney(amount: bigint | number): string {
  return formatter.format(Number(amount));
}

/** Returns an Arabic error message if the amount is invalid, or null if valid. */
export function validateMoneyAmount(amount: number): string | null {
  if (!Number.isInteger(amount) || amount < 0) {
    return "المبلغ يجب أن يكون عدداً صحيحاً موجباً";
  }
  if (amount % 250 !== 0) {
    return "المبلغ يجب أن يكون من مضاعفات 250 دينار";
  }
  return null;
}

/** Convert a display string with Arabic-Indic digits back to a plain number. */
export function parseMoney(display: string): number {
  const western = display.replace(/[٠-٩]/g, (d) =>
    String(d.charCodeAt(0) - 0x0660),
  );
  const digits = western.replace(/[^\d]/g, "");
  return parseInt(digits, 10) || 0;
}
