import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/utils/money";

const STATUS_AR: Record<string, string> = {
  NEW: "جديد",
  IN_PROGRESS: "قيد التنفيذ",
  ON_HOLD: "معلق",
  READY: "جاهز",
  DELIVERED: "تم التسليم",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("ar-IQ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Cairo",
    fontSize: 11,
    padding: 36,
    direction: "rtl",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: "1.5 solid #0284c7",
  },
  shopName: { fontSize: 18, fontWeight: 700, color: "#0284c7" },
  docTitle: { fontSize: 13, color: "#374151", textAlign: "left" },
  infoGrid: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  infoBlock: { flex: 1 },
  infoRow: { flexDirection: "row-reverse", marginBottom: 4, gap: 4 },
  infoLabel: { fontSize: 10, color: "#6b7280", minWidth: 55 },
  infoValue: { fontSize: 10, color: "#111827", fontWeight: 700 },
  table: { marginBottom: 16 },
  tableHead: {
    flexDirection: "row-reverse",
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row-reverse",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: "0.5 solid #e5e7eb",
  },
  colProduct: { flex: 4, textAlign: "right" },
  colQty: { flex: 1.2, textAlign: "center" },
  colPrice: { flex: 2, textAlign: "center" },
  colTotal: { flex: 2, textAlign: "left" },
  headText: { fontSize: 10, fontWeight: 700, color: "#374151" },
  cellText: { fontSize: 10, color: "#374151" },
  totalRow: {
    flexDirection: "row-reverse",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1 solid #d1d5db",
    gap: 12,
  },
  totalLabel: { fontSize: 12, fontWeight: 700, color: "#374151" },
  totalValue: { fontSize: 14, fontWeight: 700, color: "#0284c7" },
  notes: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  notesLabel: { fontSize: 10, color: "#6b7280", marginBottom: 4 },
  notesText: { fontSize: 10, color: "#374151", lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
});

export type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
};

export type OrderForPDF = {
  customer_name: string | null;
  status: string;
  total_price: number;
  notes: string | null;
  delivery_date: string | null;
  created_at: string;
  order_items: OrderItem[];
};

export default function OrderPDF({ order }: { order: OrderForPDF }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.shopName}>محل الأقمشة</Text>
          <Text style={s.docTitle}>فاتورة طلب</Text>
        </View>

        {/* Info grid */}
        <View style={s.infoGrid}>
          <View style={s.infoBlock}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>العميل:</Text>
              <Text style={s.infoValue}>{order.customer_name ?? "غير محدد"}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>الحالة:</Text>
              <Text style={s.infoValue}>{STATUS_AR[order.status] ?? order.status}</Text>
            </View>
          </View>
          <View style={s.infoBlock}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>التاريخ:</Text>
              <Text style={s.infoValue}>{fmtDate(order.created_at)}</Text>
            </View>
            {order.delivery_date && (
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>التسليم:</Text>
                <Text style={s.infoValue}>{fmtDate(order.delivery_date)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items table */}
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.headText, s.colProduct]}>المنتج</Text>
            <Text style={[s.headText, s.colQty]}>الكمية</Text>
            <Text style={[s.headText, s.colPrice]}>سعر الوحدة</Text>
            <Text style={[s.headText, s.colTotal]}>المجموع</Text>
          </View>
          {order.order_items.map((item, i) => (
            <View key={item.id ?? i} style={s.tableRow}>
              <Text style={[s.cellText, s.colProduct]}>{item.product_name}</Text>
              <Text style={[s.cellText, s.colQty]}>
                {item.quantity.toLocaleString("ar-IQ")}
              </Text>
              <Text style={[s.cellText, s.colPrice]}>
                {formatMoney(item.price_per_unit)}
              </Text>
              <Text style={[s.cellText, s.colTotal]}>
                {formatMoney(item.total_price)}
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>الإجمالي:</Text>
          <Text style={s.totalValue}>{formatMoney(order.total_price)}</Text>
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={s.notes}>
            <Text style={s.notesLabel}>ملاحظات</Text>
            <Text style={s.notesText}>{order.notes}</Text>
          </View>
        )}

        <Text style={s.footer}>
          {new Date().toLocaleDateString("ar-IQ", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Text>
      </Page>
    </Document>
  );
}
