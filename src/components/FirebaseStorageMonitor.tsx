import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Database,
  RefreshCw,
  Zap,
  Server,
  Layers,
  PieChart,
  ShieldCheck,
  Trash2,
  Activity,
  Calendar,
  Users,
  CreditCard,
  Mail,
  Megaphone,
  Settings,
  ShieldAlert,
  LifeBuoy
} from 'lucide-react';
import {
  calculateFirebaseStorageUsage,
  FirebaseStorageMetrics,
  formatStorageUnits
} from '../utils/firebaseStorageCalculator';

interface FirebaseStorageMonitorProps {
  language: 'en' | 'hi';
  employees?: any[];
  attendance?: any[];
  payroll?: any[];
  adminSettings?: any;
  failedLogins?: any[];
  emailLogs?: any[];
  announcements?: any[];
  hrTickets?: any[];
  passwordRequests?: any[];
  auditLogs?: any[];
  onClearEmailLogs?: () => void;
  onClearAuditLogs?: () => void;
  className?: string;
  compact?: boolean;
}

export const FirebaseStorageMonitor: React.FC<FirebaseStorageMonitorProps> = ({
  language,
  employees = [],
  attendance = [],
  payroll = [],
  adminSettings,
  failedLogins = [],
  emailLogs = [],
  announcements = [],
  hrTickets = [],
  passwordRequests = [],
  auditLogs = [],
  onClearEmailLogs,
  onClearAuditLogs,
  className = '',
  compact = false
}) => {
  const [unitMode, setUnitMode] = useState<'AUTO' | 'KB' | 'MB' | 'BYTES'>('AUTO');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const isEn = language === 'en';

  //Compute storage metrics dynamically from current state props
  const metrics: FirebaseStorageMetrics = calculateFirebaseStorageUsage({
    employees,
    attendance,
    payroll,
    adminSettings,
    failedLogins,
    emailLogs,
    announcements,
    hrTickets,
    passwordRequests,
    auditLogs
  });

  const handleManualRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsRecalculating(false);
    }, 400);
  };

  useEffect(() => {
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [
    employees.length,
    attendance.length,
    payroll.length,
    emailLogs.length,
    announcements.length,
    failedLogins.length,
    auditLogs.length
  ]);

  //Format value depending on selected Unit mode
  const getDisplayValue = () => {
    if (unitMode === 'KB') {
      return `${metrics.totalKb.toFixed(2)} KB`;
    }
    if (unitMode === 'MB') {
      return `${metrics.totalMb.toFixed(3)} MB`;
    }
    if (unitMode === 'BYTES') {
      return `${metrics.totalBytes.toLocaleString()} Bytes`;
    }
    return metrics.formattedSize;
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users': return <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'Calendar': return <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'CreditCard': return <CreditCard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'Mail': return <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      case 'Megaphone': return <Megaphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'Settings': return <Settings className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />;
      case 'ShieldAlert': return <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      case 'LifeBuoy': return <LifeBuoy className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />;
      default: return <Activity className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />;
    }
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 rounded-lg px-2.5 py-1 text-xs font-mono shadow-2xs ${className}`}>
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
          <Database className="w-3.5 h-3.5 text-[#03623c] dark:text-emerald-400 inline shrink-0" />
          <span>{'Storage:'}</span>
        </span>
        <span className="font-bold text-[#03623c] dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/80 px-1.5 py-0.2 rounded border border-emerald-200/70 dark:border-emerald-700/50">
          {getDisplayValue()}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-xs text-slate-800 dark:text-slate-100 space-y-5 ${className}`}>
      {/* Top Header & Live Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/60 text-[#03623c] dark:text-emerald-400 rounded-xl shadow-2xs">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {'Firebase Cloud Storage Monitor'}
              </h3>
              <span className="inline-flex items-center gap-1 bg-emerald-100/80 dark:bg-emerald-950/80 text-[#03623c] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {'Live'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              {'Real-time precise tracking of Firestore database usage in KB and MB'}
            </p>
          </div>
        </div>

        {/* Live Controls & Unit Toggle */}
        <div className="flex items-center gap-2">
          {/* Unit Switcher */}
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-0.5 text-[10px] font-mono font-medium">
            {(['AUTO', 'KB', 'MB', 'BYTES'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setUnitMode(mode)}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  unitMode === mode
                    ? 'bg-white dark:bg-slate-700 text-[#03623c] dark:text-emerald-300 font-bold shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleManualRecalculate}
            disabled={isRecalculating}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
            title={'Recalculate Storage Live'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin text-[#03623c]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric Card 1: Total Storage */}
        <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 relative overflow-hidden transition-all hover:border-emerald-300 dark:hover:border-emerald-700">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-[#03623c] dark:text-emerald-400" />
            {'Total Used Storage'}
          </div>
          <div className="text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight my-0.5">
            {getDisplayValue()}
          </div>
          <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-2">
            <span className="text-[#03623c] dark:text-emerald-300 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
              {metrics.totalBytes.toLocaleString()} bytes
            </span>
            <span>• {lastSyncTime}</span>
          </div>
        </div>

        {/* Metric Card 2: Document Count & Items */}
        <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 relative overflow-hidden transition-all hover:border-indigo-300 dark:hover:border-indigo-700">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            {'Stored Documents'}
          </div>
          <div className="text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight my-0.5">
            {metrics.totalDocEstimate.toLocaleString()} <span className="text-xs font-normal text-slate-500">docs</span>
          </div>
          <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-2">
            <span className="text-indigo-700 dark:text-indigo-300 font-mono bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/60">
              ~{(metrics.totalDocEstimate > 0 ? metrics.totalBytes / metrics.totalDocEstimate : 0).toFixed(0)} bytes/doc
            </span>
          </div>
        </div>

        {/* Metric Card 3: Free Spark Quota Tracker */}
        <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 relative overflow-hidden transition-all hover:border-purple-300 dark:hover:border-purple-700">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
            <Server className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            {'Firebase Quota (1 GB)'}
          </div>
          <div className="text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight my-0.5">
            {metrics.quotaPercentOf1GB < 0.01 ? '< 0.01%' : `${metrics.quotaPercentOf1GB}%`}
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-[#03623c] dark:bg-emerald-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(1, metrics.quotaPercentOf1GB)}%` }} />
          </div>
          <div className="text-[9px] font-medium text-slate-500 dark:text-slate-400 flex justify-between items-center mt-1.5">
            <span>{'Used:'} {metrics.formattedSizeMb}</span>
            <span className="text-slate-600 dark:text-slate-300 font-semibold">{'Limit: 1,024 MB'}</span>
          </div>
        </div>
      </div>

      {/* Storage Breakdown by Collection */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#03623c] dark:text-emerald-400" />
            {'Storage Breakdown by Collection'}
          </h4>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            {metrics.categories.filter(c => c.bytes > 0).length} {'Active Collections'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {metrics.categories.map((cat, idx) => {
            const displayCategorySize = 
              unitMode === 'KB' ? `${cat.kb.toFixed(2)} KB` :
              unitMode === 'MB' ? `${cat.mb.toFixed(3)} MB` :
              unitMode === 'BYTES' ? `${cat.bytes.toLocaleString()} B` :
              formatStorageUnits(cat.bytes, 2);

            return (
              <div
                key={idx}
                className="p-3 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 shrink-0 shadow-2xs">
                      {renderIcon(cat.iconName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {isEn ? cat.category : cat.categoryHi}
                      </p>
                      <p className="text-[9px] font-mono text-slate-400">
                        {cat.count} {'records'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-[#03623c] dark:text-emerald-400">
                      {displayCategorySize}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">
                      {cat.percentageOfTotal}%
                    </div>
                  </div>
                </div>

                {/* Individual Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-[#03623c] dark:bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(cat.bytes > 0 ? 3 : 0, cat.percentageOfTotal)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Storage Optimization & Quick Actions Bar */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#03623c] dark:text-emerald-400 shrink-0" />
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
            {'Firestore database storage usage is automatically tracked and updated in real-time.'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onClearEmailLogs && emailLogs.length > 0 && (
            <button
              type="button"
              onClick={onClearEmailLogs}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              {`Clear Email Logs (${emailLogs.length})`}
            </button>
          )}

          {onClearAuditLogs && auditLogs.length > 0 && (
            <button
              type="button"
              onClick={onClearAuditLogs}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              {`Clear Audit History (${auditLogs.length})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirebaseStorageMonitor;
