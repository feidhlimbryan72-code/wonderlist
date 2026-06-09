import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthPage } from './components/auth/AuthPage'
import { Dashboard } from './components/dashboard/Dashboard'
import { CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react'

// Create TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const MainAppContent: React.FC = () => {
  const { user, loading, isConfigured } = useAuth()

  // 1. If Supabase configuration is missing, show a beautiful, friendly setup page
  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6 bg-cover bg-center"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80')` }}>
        
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-0"></div>

        <div className="w-full max-w-xl bg-slate-900/90 border border-white/10 rounded-2xl p-8 relative z-10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Supabase Config Needed</h2>
              <p className="text-xs text-slate-400">Follow these steps to connect your collaborative task manager</p>
            </div>
          </div>

          <div className="space-y-5 text-sm text-slate-300">
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400 mt-0.5 shrink-0">1</div>
                <div>
                  <p className="font-semibold text-white text-xs">Create a Supabase Project</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Go to <a href="https://supabase.com" target="_blank" className="text-blue-400 hover:underline">supabase.com</a>, create a free project, and get your API details.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400 mt-0.5 shrink-0">2</div>
                <div>
                  <p className="font-semibold text-white text-xs">Initialize the Database Schema</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Open the **SQL Editor** in your Supabase dashboard and run the SQL migration script located at:</p>
                  <code className="block mt-1.5 p-2 bg-slate-950 rounded text-[10px] font-mono text-slate-300 break-all select-all">
                    supabase/migrations/20260609_initial_schema.sql
                  </code>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400 mt-0.5 shrink-0">3</div>
                <div>
                  <p className="font-semibold text-white text-xs">Configure Environment Variables</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Create a file named <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded text-[10px]">.env</code> in the project root and add your keys:</p>
                  <pre className="mt-1.5 p-2.5 bg-slate-950 rounded text-[10px] font-mono text-emerald-400 overflow-x-auto">
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here</pre>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/2 p-3.5 rounded-xl border border-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Real-time subscriptions, RLS permissions, and authentication will activate automatically once configured.</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2. Loading state (glassmorphic load screen)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80')`, backgroundSize: 'cover' }}>
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"></div>
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="inline-flex items-center justify-center p-4 bg-white/10 rounded-2xl border border-white/20 animate-pulse">
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-sm font-semibold tracking-wide text-white/80">Loading Wonderlist...</p>
        </div>
      </div>
    )
  }

  // 3. Authenticated state routing
  return user ? <Dashboard /> : <AuthPage />
}

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
