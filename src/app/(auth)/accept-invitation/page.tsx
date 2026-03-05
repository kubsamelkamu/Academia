import { Suspense } from "react"
import { Loader2, Sparkles } from "lucide-react"
import AcceptInvitationClient from "./accept-invitation-client"

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<InvitationLoadingFallback />}>
      <AcceptInvitationClient />
    </Suspense>
  )
}

function InvitationLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500/50 to-purple-600/50 rounded-2xl mb-4 mx-auto">
            <Sparkles className="w-8 h-8 text-white/70" />
          </div>
          
          <div className="space-y-3">
            <div className="h-10 w-64 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-lg mx-auto animate-pulse" />
            <div className="h-6 w-96 max-w-full bg-gray-200/50 rounded-lg mx-auto animate-pulse" />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-green-500/30 rounded-full animate-pulse" />
                <div className="h-5 w-32 bg-gray-200/50 rounded animate-pulse" />
              </div>
              
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100/50 rounded-full animate-pulse" />
                    <div className="h-4 w-48 bg-gray-200/50 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/30 to-purple-600/30 rounded-2xl p-6">
              <div className="w-8 h-8 bg-white/30 rounded-lg mb-3 animate-pulse" />
              <div className="h-5 w-32 bg-white/30 rounded mb-2 animate-pulse" />
              <div className="h-4 w-full bg-white/20 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-white/20 rounded mt-2 animate-pulse" />
            </div>
          </div>

          <div className="backdrop-blur-sm bg-white/80 border-white/20 shadow-xl rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200/50 rounded-full animate-pulse" />
                  {step < 3 && <div className="w-12 h-0.5 bg-gray-200/50 mx-2 animate-pulse" />}
                </div>
              ))}
            </div>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-500/30 rounded animate-pulse" />
                <div className="h-6 w-40 bg-gray-200/50 rounded animate-pulse" />
              </div>
              <div className="h-4 w-64 bg-gray-200/50 rounded mx-auto animate-pulse" />
            </div>

            <div className="space-y-4">
              {[1, 2, 3, 4].map((field) => (
                <div key={field} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500/30 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-200/50 rounded animate-pulse" />
                  </div>
                  <div className="h-10 w-full bg-gray-100/50 rounded-lg animate-pulse" />
                </div>
              ))}

              {/* Button Skeleton */}
              <div className="pt-4">
                <div className="h-12 w-full bg-gradient-to-r from-blue-500/30 to-purple-600/30 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-blue-500/50 animate-spin" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Text with Animation */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            Preparing your invitation...
          </p>
        </div>
      </div>
    </div>
  )
}