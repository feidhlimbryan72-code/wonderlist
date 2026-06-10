import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { LogIn, UserPlus, CheckCircle, Mail, Lock, User, AlertCircle } from 'lucide-react'
import logoImg from '../../assets/logo.png'

export const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const validateInputs = () => {
    if (!email || !password) {
      setError('Email and password are required.')
      return false
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return false
    }
    if (isSignUp && !fullName) {
      setError('Full name is required.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!validateInputs()) return

    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })

        if (signUpError) throw signUpError

        if (data.user && data.session === null) {
          setMessage('Check your email for the confirmation link to complete registration!')
          // Clear inputs
          setEmail('')
          setPassword('')
          setFullName('')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 relative" 
      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80')` }}>
      
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>

      {/* Glassmorphic Auth Card */}
      <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-fade-in border border-white/20">
        
        {/* Header decoration */}
        <div className="p-8 pb-6 text-center">
          <div className="flex justify-center mb-5 bg-white/85 dark:bg-slate-900/60 p-4 rounded-2xl shadow-sm border border-slate-200/20">
            <img src={logoImg} alt="Festival Flags Logo" className="h-20 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white mb-1">
            Festival Flags
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-xs">
            {isSignUp ? 'Create your collaborative space' : 'Welcome back to your lists'}
          </p>
        </div>

        {/* Auth Forms */}
        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-2.5 text-green-600 dark:text-green-400 text-xs">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/40 border border-slate-300/40 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white placeholder-slate-400 transition-all text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/40 border border-slate-300/40 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white placeholder-slate-400 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/40 border border-slate-300/40 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white placeholder-slate-400 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50 text-sm cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle form link */}
          <div className="mt-6 text-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            </span>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setMessage(null)
              }}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
