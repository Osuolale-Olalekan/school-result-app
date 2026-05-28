// import PageLoader from "@/components/PageLoader"
// export default PageLoader

export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-48 bg-gray-100 rounded-xl" />
      <div className="grid sm:grid-cols-3 gap-5">
        <div className="sm:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl h-40 border border-gray-100" />
          <div className="bg-white rounded-2xl h-48 border border-gray-100" />
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl h-32 border border-gray-100" />
          <div className="bg-white rounded-2xl h-32 border border-gray-100" />
        </div>
      </div>
    </div>
  );
}