import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles, Sun, Moon, Sunset, Sunrise, ShieldCheck, CheckCircle2, Clock, X, Zap, Activity } from 'lucide-react';
import { useModalBackHandler } from '../utils/useHistoryBackHandler';

interface AdminWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminName?: string;
  role?: string;
  language?: 'en' | 'hi';
  companyName?: string;
  durationMs?: number; // default 5000ms
}

export const AdminWelcomeModal: React.FC<AdminWelcomeModalProps> = ({
  isOpen,
  onClose,
  adminName = 'Boss',
  role = 'admin',
  language = 'en',
  companyName = 'Rathi Buildmart',
  durationMs = 5000,
}) => {
  useModalBackHandler(isOpen, onClose, 'admin-welcome-modal');

  const [progress, setProgress] = useState(100);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Time-of-day calculation
  const hour = currentTime.getHours();
  let greetingEn = 'Good Morning';
  let greetingHi = 'सुप्रभात';
  let TimeIcon = Sunrise;
  let bgGradient = 'from-amber-500/20 via-emerald-500/10 to-blue-500/20';

  if (hour >= 5 && hour < 12) {
    greetingEn = 'Good Morning';
    greetingHi = 'सुप्रभात';
    TimeIcon = Sunrise;
    bgGradient = 'from-amber-500/25 via-[#03623c]/20 to-emerald-600/20';
  } else if (hour >= 12 && hour < 17) {
    greetingEn = 'Good Afternoon';
    greetingHi = 'शुभ दोपहर';
    TimeIcon = Sun;
    bgGradient = 'from-blue-500/25 via-emerald-600/20 to-teal-500/20';
  } else if (hour >= 17 && hour < 22) {
    greetingEn = 'Good Evening';
    greetingHi = 'शुभ संध्या';
    TimeIcon = Sunset;
    bgGradient = 'from-indigo-600/25 via-purple-600/20 to-[#03623c]/20';
  } else {
    greetingEn = 'Good Night / Working Late';
    greetingHi = 'शुभ रात्रि / देर रात कार्य';
    TimeIcon = Moon;
    bgGradient = 'from-[#0a192f] via-slate-900 to-[#03623c]/30';
  }

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Progress bar auto-countdown
  useEffect(() => {
    if (!isOpen) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remainingPct);

      if (remainingPct <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, durationMs, onClose]);

  if (!isOpen) return null;

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const displayRoleTitle = role === 'admin' 
    ? (language === 'hi' ? 'मुख्य प्रशासक (Super Admin)' : 'System Administrator')
    : role === 'director' 
    ? (language === 'hi' ? 'निदेशक (Director)' : 'Executive Director')
    : (language === 'hi' ? 'प्रबंधक (Manager)' : 'Manager');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto bg-black/75 backdrop-blur-md">
        {/* Glowing backdrop animated ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`relative w-full max-w-lg rounded-3xl border border-amber-400/30 bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0a1120] text-white shadow-2xl overflow-hidden p-6 sm:p-8`}
        >
          {/* Top Progress bar indicator */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-300 transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Ambient background particles glow */}
          <div className={`absolute -top-24 -right-24 w-60 h-60 rounded-full bg-gradient-to-br ${bgGradient} blur-3xl pointer-events-none opacity-60`} />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-transparent blur-3xl pointer-events-none opacity-50" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer z-20"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Animated Crown Icon with shimmering sparkles */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              className="relative mb-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-xl shadow-amber-500/20 flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 animate-pulse" />
                  <Crown className="w-10 h-10 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                </div>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-2 -right-2 text-amber-300"
              >
                <Sparkles className="w-6 h-6 drop-shadow" />
              </motion.div>
            </motion.div>

            {/* Time-based Badge */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3 shadow-inner"
            >
              <TimeIcon className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>{language === 'hi' ? `${greetingHi}, ${companyName}` : `${greetingEn}, ${companyName}`}</span>
            </motion.div>

            {/* Main Welcome Headline */}
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-white to-emerald-200 bg-clip-text text-transparent mb-1"
            >
              {language === 'hi' ? `स्वागत है बॉस! 👑` : `Welcome Boss! 👑`}
            </motion.h2>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-sm font-medium text-slate-300 mb-5"
            >
              {adminName && adminName !== 'Boss' ? `${adminName} • ` : ''}
              <span className="text-amber-400 font-semibold">{displayRoleTitle}</span>
            </motion.p>

            {/* Date & Live Time Bar */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 mb-5 flex items-center justify-between text-xs text-slate-300 font-mono shadow-inner"
            >
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{formattedDate}</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {formattedTime}
              </div>
            </motion.div>

            {/* Quick Status Highlights */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="grid grid-cols-2 gap-2.5 w-full mb-6 text-left"
            >
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">System Role</p>
                  <p className="text-xs font-bold text-slate-200">Admin Privilege</p>
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Google Sync</p>
                  <p className="text-xs font-bold text-slate-200">Active & Ready</p>
                </div>
              </div>
            </motion.div>

            {/* Action button */}
            <motion.button
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:from-amber-400 hover:to-teal-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              id="btn-close-admin-welcome-modal"
            >
              <CheckCircle2 className="w-4 h-4" />
              {language === 'hi' ? 'कार्य शुरू करें (Let\'s Work) 🚀' : 'Let\'s Get to Work Boss 🚀'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminWelcomeModal;
