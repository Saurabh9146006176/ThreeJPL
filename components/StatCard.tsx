import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string; // expects a tailwind class like 'text-blue-500'
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6 relative overflow-hidden group hover:bg-slate-800/60 transition-all duration-300">
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1 neon-text">{value}</p>
        </div>
        <div className={`p-2 md:p-3 rounded-xl bg-slate-800/80 border border-white/5 shadow-inner ${color}`}>
          {icon}
        </div>
      </div>
      
      {/* Decorative Glow */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 blur-xl group-hover:opacity-20 transition-opacity ${color.replace('text', 'bg')}`}></div>
    </div>
  );
};