import AnnouncementsView from "@/components/shared/AnnouncementsView";
 
export default function AnnouncementsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#f5f0e8" }}>
          Announcements
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(245,240,232,0.4)" }}>
          School-wide and class-specific announcements
        </p>
      </div>
      <AnnouncementsView />
    </div>
  );
}