import { School2Icon } from "lucide-react"

export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Outer expanding ripple - Navy Blue */}
        <div className="absolute w-full h-full border-4 border-blue-900/30 rounded-full animate-[ping_2s_ease-in-out_infinite]" />
        
        {/* Inner expanding ripple - Orange */}
        <div className="absolute w-16 h-16 border-4 border-orange-500/50 rounded-full animate-[ping_1.5s_ease-in-out_infinite]" />
        
        {/* Solid center dot - Navy Blue */}
        <div className="z-10 flex items-center justify-center w-12 h-12 bg-blue-900 rounded-full shadow-lg">
          {/* Icon - Orange */}
          <School2Icon className="w-5 h-5 text-orange-400 animate-pulse" />
        </div>
      </div>
    </div>
  )
}


  
