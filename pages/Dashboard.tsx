import React from 'react';
import { Team, Player, AuctionSettings } from '../types';
import { StatCard } from '../components/StatCard';
import { Users, UserCheck, DollarSign, Activity, TrendingUp } from 'lucide-react';

interface DashboardProps {
  teams: Team[];
  players: Player[];
  settings: AuctionSettings;
}

export const Dashboard: React.FC<DashboardProps> = ({ teams, players, settings }) => {
  const totalPurse = teams.length * settings.totalPurse;
  const currentTotalPurse = teams.reduce((acc, t) => acc + t.purseRemaining, 0);
  const moneySpent = totalPurse - currentTotalPurse;
  
  const soldPlayers = players.filter(p => p.isSold).length;
  const unsoldPlayers = players.length - soldPlayers;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Command Center</h2>
          <p className="text-slate-400 mt-1">Real-time auction analytics and team status</p>
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium flex items-center">
             <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
             System Online
           </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Roster Completion */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-cyan-500" />
              Squad Composition
            </h3>
            <span className="text-xs text-slate-500 uppercase tracking-wider">Fill Rate</span>
          </div>
          <div className="space-y-5">
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
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
              Budget Utilization
            </h3>
            <span className="text-xs text-slate-500 uppercase tracking-wider">Remaining Purse</span>
          </div>
          <div className="space-y-5">
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