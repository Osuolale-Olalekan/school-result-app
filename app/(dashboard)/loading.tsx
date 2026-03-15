// app/(dashboard)/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center h-64 w-full">
      <div
        className="w-6 h-6 rounded-full border-2 animate-spin"
        style={{ borderColor: "rgba(14,165,233,0.3)", borderTopColor: "#38bdf8" }}
      />
    </div>
  );
}