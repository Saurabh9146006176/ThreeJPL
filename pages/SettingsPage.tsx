import React, { useState } from 'react';
import { AuctionSettings, ConfirmAction } from '../types';
import { Save, AlertTriangle, Sliders, Database } from 'lucide-react';

interface SettingsPageProps {
  settings: AuctionSettings;
  onSave: (newSettings: AuctionSettings) => void;
  onLoadDemoData: () => void;
  confirmAction: ConfirmAction;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSave, onLoadDemoData, confirmAction }) => {
  const [formData, setFormData] = useState<AuctionSettings>(settings);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof AuctionSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: Number(value) }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <Sliders className="mr-3 text-cyan-500" /> Configuration
            </h2>
            <p className="text-slate-400 mt-1">Adjust auction parameters and game rules</p>
        </div>
        
        <button 
          onClick={() => {
            confirmAction(
              'Load Demo Data?', 
              "This will replace all current teams and players with demo data. Continue?", 
              () => onLoadDemoData()
            );
          }}
          className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-900/30 rounded-lg text-sm font-medium transition-colors"
        >
          <Database size={16} className="mr-2" />
          Load Demo Data
        </button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8 flex gap-3 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
        <AlertTriangle className="text-amber-500 flex-shrink-0" />
        <p className="text-sm text-amber-200/80">
          <span className="font-bold text-amber-500">Warning:</span> Changing these settings during an active auction will affect calculations immediately. Reducing 'Max Players' below current team sizes may cause errors.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl overflow-hidden border border-white/5">
        <div className="p-8 space-y-8">
          
          <div className="border-b border-white/5 pb-8">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-xs border-l-4 border-blue-500 pl-3">Team & Purse Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Max Players Per Team</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="50"
                  value={formData.maxPlayersPerTeam}
                  onChange={(e) => handleChange('maxPlayersPerTeam', e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-2">Includes the Captain.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Team Purse (₹)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={formData.totalPurse}
                  onChange={(e) => handleChange('totalPurse', e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Default Base Price (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.defaultBasePrice}
                  onChange={(e) => handleChange('defaultBasePrice', e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-xs border-l-4 border-purple-500 pl-3">Bid Increment Slabs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative group">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Low Tier (0 - 2L)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 group-focus-within:text-cyan-400">+</span>
                  <input
                    type="number"
                    required
                    value={formData.bidIncrement1}
                    onChange={(e) => handleChange('bidIncrement1', e.target.value)}
                    className="w-full pl-6 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none text-white font-mono"
                  />
                </div>
              </div>
              <div className="relative group">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Mid Tier (2L - 5L)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 group-focus-within:text-cyan-400">+</span>
                  <input
                    type="number"
                    required
                    value={formData.bidIncrement2}
                    onChange={(e) => handleChange('bidIncrement2', e.target.value)}
                    className="w-full pl-6 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none text-white font-mono"
                  />
                </div>
              </div>
              <div className="relative group">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">High Tier (5L+)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 group-focus-within:text-cyan-400">+</span>
                  <input
                    type="number"
                    required
                    value={formData.bidIncrement3}
                    onChange={(e) => handleChange('bidIncrement3', e.target.value)}
                    className="w-full pl-6 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="bg-slate-900/50 px-8 py-5 flex items-center justify-between border-t border-white/5 backdrop-blur-md">
          <p className="text-sm text-green-400 font-bold transition-all duration-300 flex items-center" style={{ opacity: saved ? 1 : 0, transform: saved ? 'translateY(0)' : 'translateY(10px)' }}>
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
            System Updated
          </p>
          <button 
            type="submit"
            className="flex items-center px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/30 transition-all hover:scale-105"
          >
            <Save size={18} className="mr-2" />
            Apply Changes
          </button>
        </div>
      </form>
    </div>
  );
};