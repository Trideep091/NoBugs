import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ShieldAlert, Sun, Moon, Lock, Mail, User as UserIcon, ArrowRight, Zap, CheckCircle } from 'lucide-react';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Please enter your full name');
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setLocalError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCreds = () => {
    setEmail('oncall@nobugs.io');
    setPassword('oncall3am');
    setIsRegister(false);
    setLocalError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#FAF8F5] dark:bg-[#0C0E12] text-[#2C1810] dark:text-[#F3EFEA] transition-colors duration-200">
      {/* Header bar with theme toggle */}
      <div className="p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#0C0E12] border border-[#E8DFD8] dark:border-[#383F54] shadow-md">
            <img src="/logo.png" alt="NoBugs Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-[#2C1810] dark:text-[#F3EFEA]">
              NoBugs
            </span>
            <p className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
              Find the signal in the noise.
            </p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-[#E8DFD8] dark:border-[#272C3D] bg-white dark:bg-[#151821] text-[#705D55] dark:text-[#A9B2C3] hover:text-[#8C4A26] dark:hover:text-[#E07A5F] shadow-sm transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#8C4A26]" />}
        </button>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <div className="bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] rounded-2xl p-8 shadow-xl shadow-[#8C4A26]/5 dark:shadow-black/40">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#0C0E12] border border-[#E8DFD8] dark:border-[#383F54] shadow-lg shadow-[#8C4A26]/10 mx-auto mb-3 transition-transform hover:scale-105">
              <img src="/logo.png" alt="NoBugs Official Logo" className="w-full h-full object-cover" />
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F7EDE7] dark:bg-[#2A1F1B] text-[#8C4A26] dark:text-[#E07A5F] text-xs font-semibold mb-3 border border-[#E8DFD8] dark:border-[#5A2718]">
              <Zap className="w-3.5 h-3.5" />
              <span>3 AM On-Call Intelligence</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#2C1810] dark:text-[#F3EFEA]">
              {isRegister ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-xs text-[#705D55] dark:text-[#A9B2C3] mt-1">
              {isRegister
                ? 'Join your engineering team on the incident response bridge'
                : 'Turn 10,000 log lines into actionable incidents in seconds'}
            </p>
          </div>

          {localError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
              {localError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-[#705D55] dark:text-[#A9B2C3] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#9C8980] dark:text-[#6B768E] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C4A26] dark:focus:ring-[#E07A5F] text-[#2C1810] dark:text-[#F3EFEA] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#705D55] dark:text-[#A9B2C3] mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9C8980] dark:text-[#6B768E] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@company.internal"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C4A26] dark:focus:ring-[#E07A5F] text-[#2C1810] dark:text-[#F3EFEA] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#705D55] dark:text-[#A9B2C3] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9C8980] dark:text-[#6B768E] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C4A26] dark:focus:ring-[#E07A5F] text-[#2C1810] dark:text-[#F3EFEA] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8C4A26] to-[#C86D3B] hover:from-[#7A3F1F] hover:to-[#B65D2E] dark:from-[#E07A5F] dark:to-[#F4A261] dark:hover:from-[#D1684B] dark:hover:to-[#E59350] text-white font-semibold text-sm shadow-md shadow-[#8C4A26]/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{submitting ? 'Authenticating...' : isRegister ? 'Register now' : 'Sign in'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Creds Auto-Fill Button */}
          <div className="mt-5 pt-4 border-t border-[#E8DFD8] dark:border-[#272C3D]">
            <button
              type="button"
              onClick={fillDemoCreds}
              className="w-full py-2 px-3 rounded-lg bg-[#FAF8F5] dark:bg-[#1C202C] hover:bg-[#F5EFEB] dark:hover:bg-[#252B3B] text-xs font-medium text-[#705D55] dark:text-[#A9B2C3] border border-[#E8DFD8] dark:border-[#272C3D] flex items-center justify-center space-x-2 transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Use Demo On-Call Credentials (1-Click)</span>
            </button>
          </div>

          {/* Toggle between Register and Sign in */}
          <div className="mt-5 text-center">
            <p className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setLocalError(null);
                }}
                className="font-semibold text-[#8C4A26] dark:text-[#E07A5F] hover:underline ml-1"
              >
                {isRegister ? 'Sign in' : 'Register now'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-[#9C8980] dark:text-[#6B768E]">
        NoBugs &bull; Automated Log Intelligence &bull; Built for High-Pressure On-Call SREs
      </div>
    </div>
  );
}
