import AppShell from "@/components/layout/AppShell";
import ProductDetail from "./ProductDetail";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell title="تعديل المنتج">
      <ProductDetail id={id} />
    </AppShell>
  );
}
