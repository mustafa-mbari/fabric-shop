import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatMoney } from "@/lib/utils/money";

const TYPE_AR: Record<string, string> = {
  WHOLESALE: "بالجملة",
  RETAIL: "بالمفرد",
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
  customerCard: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
  },
  customerLabel: { fontSize: 10, color: "#6b7280", marginBottom: 2 },
  customerValue: { fontSize: 12, fontWeight: 700, color: "#111827" },
  table: { marginBottom: 16 },
  tableHead: {
    flexDirection: "row-reverse",
    backgroundColor: "#e0f2fe",
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
  tableFooter: {
    flexDirection: "row-reverse",
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  colDate: { flex: 2, textAlign: "right" },
  colType: { flex: 1.5, textAlign: "center" },
  colTotal: { flex: 2, textAlign: "center" },
  colPaid: { flex: 2, textAlign: "center" },
  colRemaining: { flex: 2, textAlign: "left" },
  headText: { fontSize: 10, fontWeight: 700, color: "#0369a1" },
  cellText: { fontSize: 10, color: "#374151" },
  footText: { fontSize: 10, fontWeight: 700, color: "#374151" },
  summary: {
    flexDirection: "row-reverse",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 20,
  },
  summaryBox: {
    alignItems: "center",
    padding: 10,
    borderRadius: 4,
    minWidth: 110,
  },
  summaryLabel: { fontSize: 9, color: "#6b7280", marginBottom: 4 },
  summaryValue: { fontSize: 13, fontWeight: 700 },
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

export type CustomerForPDF = {
  name: string;
  phone: string;
};

export type DebtForPDF = {
  type: "WHOLESALE" | "RETAIL";
  amount_total: number;
  amount_paid: number;
  remaining: number;
  note: string | null;
  created_at: string;
};

export default function DebtsPDF({
  customer,
  debts,
}: {
  customer: CustomerForPDF;
  debts: DebtForPDF[];
}) {
  const totalAmount = debts.reduce((s, d) => s + Number(d.amount_total), 0);
  const totalPaid = debts.reduce((s, d) => s + Number(d.amount_paid), 0);
  const totalRemaining = debts.reduce((s, d) => s + Number(d.remaining), 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.shopName}>محل الأقمشة</Text>
          <Text style={s.docTitle}>كشف حساب</Text>
        </View>

        {/* Customer info */}
        <View style={s.customerCard}>
          <View>
            <Text style={s.customerLabel}>العميل</Text>
            <Text style={s.customerValue}>{customer.name}</Text>
          </View>
          <View>
            <Text style={s.customerLabel}>الهاتف</Text>
            <Text style={s.customerValue}>{customer.phone}</Text>
          </View>
          <View>
            <Text style={s.customerLabel}>التاريخ</Text>
            <Text style={s.customerValue}>
              {new Date().toLocaleDateString("ar-IQ", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        {/* Debts table */}
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.headText, s.colDate]}>التاريخ</Text>
            <Text style={[s.headText, s.colType]}>النوع</Text>
            <Text style={[s.headText, s.colTotal]}>الإجمالي</Text>
            <Text style={[s.headText, s.colPaid]}>المدفوع</Text>
            <Text style={[s.headText, s.colRemaining]}>المتبقي</Text>
          </View>

          {debts.length === 0 && (
            <View style={s.tableRow}>
              <Text style={{ ...s.cellText, textAlign: "center", flex: 1 }}>
                لا توجد ديون
              </Text>
            </View>
          )}

          {debts.map((debt, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={[s.cellText, s.colDate]}>{fmtDate(debt.created_at)}</Text>
              <Text style={[s.cellText, s.colType]}>
                {TYPE_AR[debt.type] ?? debt.type}
              </Text>
              <Text style={[s.cellText, s.colTotal]}>
                {formatMoney(debt.amount_total)}
              </Text>
              <Text style={[s.cellText, s.colPaid]}>
                {formatMoney(debt.amount_paid)}
              </Text>
              <Text
                style={[
                  s.cellText,
                  s.colRemaining,
                  { color: debt.remaining > 0 ? "#dc2626" : "#16a34a" },
                ]}
              >
                {formatMoney(debt.remaining)}
              </Text>
            </View>
          ))}

          {debts.length > 0 && (
            <View style={s.tableFooter}>
              <Text style={[s.footText, s.colDate]}>الإجمالي</Text>
              <Text style={[s.footText, s.colType]} />
              <Text style={[s.footText, s.colTotal]}>{formatMoney(totalAmount)}</Text>
              <Text style={[s.footText, s.colPaid]}>{formatMoney(totalPaid)}</Text>
              <Text
                style={[
                  s.footText,
                  s.colRemaining,
                  { color: totalRemaining > 0 ? "#dc2626" : "#16a34a" },
                ]}
              >
                {formatMoney(totalRemaining)}
              </Text>
            </View>
          )}
        </View>

        <Text style={s.footer}>
          تاريخ الطباعة:{" "}
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
