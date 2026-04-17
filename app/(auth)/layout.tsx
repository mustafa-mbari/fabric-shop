export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #1e3a5f 100%)" }}>
      {children}
    </div>
  );
}
