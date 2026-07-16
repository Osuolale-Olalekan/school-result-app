export default function SectionBanner({
  img,
  alt,
  breadcrumb,
  title,
}: {
  img: string;
  alt: string;
  breadcrumb: string;
  title: string;
}) {
  return (
    <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden pt-[68px]">
      <img src={img} alt={alt} className="absolute inset-0 w-full h-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 to-blue-900/85" />
      <div className="absolute bottom-0 left-0 right-0 pb-7 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* <p className="text-white/60 text-xs mb-1.5">
            Home &rsaquo; <span className="text-white">{breadcrumb}</span>
          </p> */}
          <h2 className="text-white font-black text-2xl sm:text-3xl md:text-4xl leading-tight">{title}</h2>
        </div>
      </div>
    </div>
  );
}
