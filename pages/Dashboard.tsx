import React, { useState } from 'react';
import { Team, Player, AuctionSettings } from '../types';
import { StatCard } from '../components/StatCard';
import { Users, UserCheck, DollarSign, Activity, TrendingUp, RefreshCw } from 'lucide-react';

interface DashboardProps {
  teams: Team[];
  players: Player[];
  settings: AuctionSettings;
  onReload?: () => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({ teams, players, settings, onReload }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalPurse = teams.length * settings.totalPurse;
  const currentTotalPurse = teams.reduce((acc, t) => acc + t.purseRemaining, 0);
  const moneySpent = totalPurse - currentTotalPurse;
  
  const soldPlayers = players.filter(p => p.isSold).length;
  const unsoldPlayers = players.length - soldPlayers;

  const handleRefresh = async () => {
    if (!onReload || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onReload();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Command Center</h2>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Real-time auction analytics and team status</p>
        </div>
        <div className="flex gap-2">
           {onReload && (
             <button
               onClick={handleRefresh}
               disabled={isRefreshing}
               className="px-3 py-1 bg-slate-700 text-slate-300 border border-slate-600 rounded-full text-xs font-medium hover:bg-slate-600 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               title="Refresh Data"
             >
               <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
               {isRefreshing ? 'Refreshing...' : 'Refresh'}
             </button>
           )}
           <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium flex items-center">
             <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
             System Online
           </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Total Teams" 
          value={teams.length} 
          icon={<Users size={24} />} 
          color="text-blue-400"
        />
        <StatCard 
          title="Sold / Total" 
          value={`${soldPlayers} / ${players.length}`} 
          icon={<UserCheck size={24} />} 
          color="text-cyan-400"
        />
        <StatCard 
          title="Total Spend" 
          value={`₹${(moneySpent / 100000).toFixed(2)}L`} 
          icon={<DollarSign size={24} />} 
          color="text-purple-400"
        />
        <StatCard 
          title="Pool Remaining" 
          value={unsoldPlayers} 
          icon={<Activity size={24} />} 
          color="text-pink-400"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        {/* Roster Completion */}
        <div className="glass-panel p-4 md:p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-bold text-white flex items-center">
              <Users className="w-4 h-4 md:w-5 md:h-5 mr-2 text-cyan-500" />
              Squad Composition
            </h3>
            <span className="text-xs text-slate-500 uppercase tracking-wider">Fill Rate</span>
          </div>
          <div className="space-y-4 md:space-y-5">
            {teams.map(team => {
              const rosterCount = team.playersBought.length + 2; // +2 for Fixed Players
              const fillPercentage = (rosterCount / settings.maxPlayersPerTeam) * 100;
              return (
                <div key={team.id} className="group">
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-200 group-hover:text-cyan-400 transition-colors">{team.name}</span>
                    <span className="text-slate-500">{rosterCount} <span className="text-slate-700">/</span> {settings.maxPlayersPerTeam}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full shadow-[0_0_10px_rgba(34,211,238,0.3)]" 
                      style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="glass-panel p-4 md:p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-bold text-white flex items-center">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 mr-2 text-purple-500" />
              Budget Utilization
            </h3>
            <span className="text-xs text-slate-500 uppercase tracking-wider">Remaining Purse</span>
          </div>
          <div className="space-y-4 md:space-y-5">
            {teams.map(team => {
              const spendPercentage = ((settings.totalPurse - team.purseRemaining) / settings.totalPurse) * 100;
              const isLow = team.purseRemaining < (settings.totalPurse * 0.2);
              
              return (
                <div key={team.id} className="group">
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-200 group-hover:text-purple-400 transition-colors">{team.name}</span>
                    <span className={`font-mono ${isLow ? 'text-red-400' : 'text-green-400'}`}>₹{team.purseRemaining.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5">
                    <div 
                      className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-400'}`}
                      style={{ width: `${Math.min(spendPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};