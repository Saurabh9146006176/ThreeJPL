import React, { useState, useEffect } from 'react';
import { Player, Team, AuctionSettings, ConfirmAction } from '../types';
import { canTeamBid, getNextBidAmount, calculateMaxBid } from '../utils/auctionLogic';
import { Gavel, CheckCircle, User, Shield, Edit3, X, RotateCcw, TrendingUp, SkipForward, AlertTriangle, ChevronRight, RefreshCcw } from 'lucide-react';

interface AuctionPageProps {
  teams: Team[];
  players: Player[];
  settings: AuctionSettings;
  onPlayerSold: (playerId: string, teamId: string, price: number) => void;
  onUndoLastSold: () => void;
  canUndo: boolean;
  onSkipPlayer: (playerId: string) => void;
  onResetAuction: () => void;
  confirmAction: ConfirmAction;
}

export const AuctionPage: React.FC<AuctionPageProps> = ({ teams, players, settings, onPlayerSold, onUndoLastSold, canUndo, onSkipPlayer, onResetAuction, confirmAction }) => {
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [leadingTeamId, setLeadingTeamId] = useState<string | null>(null);
  const [customBidTeamId, setCustomBidTeamId] = useState<string | null>(null);
  const [customBidValue, setCustomBidValue] = useState<string>('');

  // Auto-select next unsold player
  const currentPlayer = players.find(p => !p.isSold);

  // Initialize bid when player loads
  useEffect(() => {
    if (currentPlayer) {
      setCurrentBid(currentPlayer.basePrice);
      setLeadingTeamId(null);
      setCustomBidTeamId(null);
    }
  }, [currentPlayer?.id]);

  const amountToBid = leadingTeamId === null ? currentBid : getNextBidAmount(currentBid, settings);

  const handleBid = (team: Team, amount: number) => {
    const validation = canTeamBid(team, amount, settings);
    if (!validation.allowed) {
      alert(`Cannot Bid: ${validation.reason}`);
      return;
    }
    setCurrentBid(amount);
    setLeadingTeamId(team.id);
    setCustomBidTeamId(null); 
  };

  const handleSold = () => {
    if (!currentPlayer || !leadingTeamId) return;
    const teamName = teams.find(t => t.id === leadingTeamId)?.name;
    confirmAction(
      'Confirm Sale', 
      `Sell ${currentPlayer.name} to ${teamName} for ₹${currentBid.toLocaleString()}?`,
      () => onPlayerSold(currentPlayer.id, leadingTeamId, currentBid)
    );
  };

  const handleSkip = () => {
    if(!currentPlayer) return;
    confirmAction(
      'Skip Player?',
      `Pass on ${currentPlayer.name} for now? They will be moved to the end of the list.`,
      () => onSkipPlayer(currentPlayer.id)
    );
  };

  // --- RENDER COMPLETE STATE ---
  if (!currentPlayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full glass-panel rounded-3xl border border-white/10 m-4">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Auction Complete</h2>
        <p className="text-slate-400 mt-1 mb-6 text-sm">All players processed.</p>
        <div className="flex gap-3">
          {canUndo && (
            <button 
              onClick={() => confirmAction('Undo Last Sale?', "Undo the last sale?", () => onUndoLastSold())}
              className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm"
            >
              <RotateCcw size={16} className="mr-2" /> Rewind Last
            </button>
          )}
          <button 
            onClick={() => confirmAction('Reset Auction?', "This will unsold all players and reset all teams. Are you sure?", onResetAuction)}
            className="flex items-center px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-lg text-red-400 text-sm"
          >
            <RefreshCcw size={16} className="mr-2" /> Reset Auction
          </button>
        </div>
      </div>
    );
  }

  const leadingTeam = teams.find(t => t.id === leadingTeamId);

  // --- RENDER MAIN AUCTION ---
  return (
    <div className="flex h-[calc(100vh-2.5rem)] gap-6 overflow-hidden">
      
      {/* 1. LEFT COLUMN: PLAYER CARD (Fixed Width) */}
      <div className="w-[340px] flex flex-col h-full shrink-0">
        <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden flex flex-col h-full relative shadow-2xl">
          
          {/* Header */}
          <div className="bg-slate-900/80 px-4 py-3 flex justify-between items-center border-b border-white/5">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live</span>
             </div>
             <div className="text-[10px] font-mono text-cyan-400">#{currentPlayer.id.toString().toUpperCase().slice(-4)}</div>
          </div>

          {/* Photo & Name */}
          <div className="flex-1 flex flex-col items-center p-6 overflow-hidden relative justify-center">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none"></div>
             
             <div className="relative mb-5 shrink-0 transform hover:scale-105 transition-transform duration-500">
                <div className="w-36 h-36 rounded-full border-4 border-slate-800 p-1 bg-slate-900 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center">
                   {currentPlayer.photoUrl ? (
                     <img src={currentPlayer.photoUrl} className="w-full h-full object-cover rounded-full" alt={currentPlayer.name} />
                   ) : (
                     <div className="text-slate-600"><User size={64} /></div>
                   )}
                </div>
             </div>

             <h2 className="text-2xl font-black text-white text-center leading-tight mb-2 uppercase tracking-wide px-2">{currentPlayer.name}</h2>
             
             <div className="flex flex-wrap gap-2 justify-center mb-6">
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-full text-[10px] uppercase font-bold tracking-wider">
                    {currentPlayer.category}
                </span>
                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-full text-[10px] uppercase font-bold tracking-wider">
                    {currentPlayer.experience}
                </span>
             </div>

             {/* Pricing Block */}
             <div className="w-full space-y-3 mt-auto">
                <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-white/5">
                   <span className="text-[10px] text-slate-400 uppercase font-bold">Base Price</span>
                   <span className="text-lg font-bold text-slate-300 font-mono">₹{currentPlayer.basePrice.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center bg-gradient-to-b from-slate-800 to-slate-900 p-4 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                   <span className="text-[10px] text-cyan-400 uppercase font-bold mb-1 tracking-widest">Current Bid</span>
                   <span className="text-4xl font-black text-white font-mono tracking-tight neon-text">₹{currentBid.toLocaleString()}</span>
                </div>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-900/95 border-t border-white/5 space-y-3 z-10 backdrop-blur-xl">
             <div className="flex justify-between items-center bg-slate-800 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Winning Team:</span>
                <span className={`font-bold text-xs truncate max-w-[140px] ${leadingTeam ? 'text-cyan-400' : 'text-slate-600'}`}>
                  {leadingTeam ? leadingTeam.name : 'Waiting for bid...'}
                </span>
             </div>

             <button 
               onClick={handleSold}
               disabled={!leadingTeamId}
               className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex justify-center items-center transition-all transform active:scale-95 ${
                 leadingTeamId 
                   ? 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white shadow-green-900/30' 
                   : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
               }`}
             >
               <Gavel size={18} className="mr-2" /> SOLD PLAYER
             </button>
             
             <div className="grid grid-cols-3 gap-2">
                <button onClick={handleSkip} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-bold py-2.5 rounded-lg flex items-center justify-center border border-slate-700 transition-colors">
                    <SkipForward size={12} className="mr-1.5" /> SKIP
                </button>
                {canUndo && (
                  <button onClick={() => confirmAction('Undo?', "Undo last?", () => onUndoLastSold())} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-bold py-2.5 rounded-lg flex items-center justify-center border border-slate-700 transition-colors">
                    <RotateCcw size={12} className="mr-1.5" /> UNDO
                  </button>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* 2. RIGHT COLUMN: 2-COLUMN GRID (SIDE BY SIDE) */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4 px-1 shrink-0 bg-slate-900/60 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
           <h3 className="text-slate-200 font-bold text-base flex items-center uppercase tracking-wider">
             <TrendingUp size={20} className="mr-3 text-cyan-500" /> 
             Active Bidders ({teams.length})
           </h3>
           <div className="flex items-center gap-3">
             <span className="text-xs text-slate-500 font-bold uppercase">Next Bid Required:</span>
             <span className="text-base font-mono font-bold text-cyan-400 bg-cyan-950/40 px-4 py-1.5 rounded-lg border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
               ₹{amountToBid.toLocaleString()}
             </span>
           </div>
        </div>

        {/* The List: 2-Column Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
           <div className="grid grid-cols-2 gap-4 pb-4 content-start">
           {teams.map(team => {
             const rosterCount = team.playersBought.length + 2;
             const isFull = rosterCount >= settings.maxPlayersPerTeam;
             const isLeader = leadingTeamId === team.id;
             const validation = canTeamBid(team, amountToBid, settings);
             const canAffordNext = validation.allowed;
             const isCustomInputOpen = customBidTeamId === team.id;
             const maxBid = calculateMaxBid(team, settings); // Calculated here for display
             
             const canCustomBid = !isFull && (canAffordNext || team.purseRemaining > currentBid);

             return (
               <div 
                 key={team.id} 
                 className={`relative flex items-center px-5 py-3 rounded-2xl border-2 transition-all duration-200 min-h-[84px] ${
                   isLeader 
                     ? 'bg-gradient-to-r from-slate-900 to-green-900/30 border-green-500/50 shadow-[0_0_25px_rgba(34,197,94,0.15)] z-10 scale-[1.01]' 
                     : !canAffordNext 
                       ? 'bg-slate-900/40 border-slate-800 opacity-60 grayscale' 
                       : 'bg-slate-800/40 border-white/5 hover:border-cyan-500/30 hover:bg-slate-800/80 hover:shadow-lg'
                 }`}
               >
                 {isLeader && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500 rounded-l-2xl"></div>}

                 {/* Identity (Left) */}
                 <div className="flex items-center gap-4 w-[30%] min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-cover" /> : <Shield size={20} className="text-slate-600" />}
                    </div>
                    <div className="min-w-0 flex flex-col justify-center">
                        <h4 className={`font-bold text-base truncate leading-tight ${isLeader ? 'text-green-400' : 'text-slate-200'}`}>{team.name}</h4>
                        <div className="text-xs text-slate-500 truncate mt-1 flex items-center">
                          <User size={10} className="mr-1" />
                          {team.captainName}
                        </div>
                    </div>
                 </div>

                 {/* Stats (Center) */}
                 <div className="flex items-center gap-3 w-[40%] justify-center px-2">
                     <div className="flex-1 text-center bg-slate-900/50 rounded-xl p-1.5 border border-white/5">
                        <div className={`text-xs font-mono font-bold ${team.purseRemaining < amountToBid ? 'text-red-400' : 'text-slate-200'}`}>
                           {team.purseRemaining >= 100000 ? (team.purseRemaining/100000).toFixed(2)+'L' : (team.purseRemaining/1000).toFixed(0)+'k'}
                        </div>
                        <div className="text-[10px] text-slate-600 uppercase font-bold tracking-wide">Purse</div>
                     </div>
                     <div className="flex-1 text-center bg-slate-900/50 rounded-xl p-1.5 border border-white/5">
                        <div className="text-xs font-mono font-bold text-yellow-500">
                           {maxBid >= 100000 ? (maxBid/100000).toFixed(2)+'L' : (maxBid/1000).toFixed(0)+'k'}
                        </div>
                        <div className="text-[10px] text-slate-600 uppercase font-bold tracking-wide">Max</div>
                     </div>
                     <div className="flex-1 text-center bg-slate-900/50 rounded-xl p-1.5 border border-white/5">
                        <div className={`text-xs font-bold ${isFull ? 'text-red-400' : 'text-cyan-400'}`}>
                           {rosterCount}/{settings.maxPlayersPerTeam}
                        </div>
                        <div className="text-[10px] text-slate-600 uppercase font-bold tracking-wide">Squad</div>
                     </div>
                 </div>

                 {/* Actions (Right) */}
                 <div className="flex items-center justify-end w-[30%] gap-2 pl-2">
                    {isCustomInputOpen ? (
                       <div className="flex gap-2 w-full justify-end">
                          <input 
                            type="number" autoFocus
                            className="w-16 bg-slate-900 border border-cyan-500/50 rounded-lg px-2 font-mono text-white text-xs h-10 outline-none shadow-inner"
                            value={customBidValue} onChange={(e) => setCustomBidValue(e.target.value)}
                          />
                          <button onClick={() => { const val = Number(customBidValue); if(val >= currentBid) handleBid(team, val); }} className="bg-cyan-600 text-white px-2 rounded-lg h-10 hover:bg-cyan-500 text-xs font-bold shadow-lg shadow-cyan-900/20">✓</button>
                          <button onClick={() => setCustomBidTeamId(null)} className="bg-slate-700 text-slate-400 px-2 rounded-lg h-10 hover:bg-slate-600"><X size={14} /></button>
                       </div>
                    ) : (
                       <>
                          <button
                            disabled={!canAffordNext}
                            onClick={() => handleBid(team, amountToBid)}
                            className={`flex-1 h-10 rounded-xl text-xs font-bold uppercase tracking-wide transition-all active:scale-95 shadow-md flex items-center justify-center ${
                              !canAffordNext
                                ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-700'
                                : isLeader
                                  ? 'bg-slate-800 text-green-500 cursor-default border border-green-500/30 shadow-none'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 shadow-blue-900/20 hover:shadow-blue-500/30'
                            }`}
                          >
                            {!canAffordNext 
                              ? (isFull ? 'Squad Full' : 'No Funds')
                              : isLeader 
                                 ? 'Leading' 
                                 : `BID ${amountToBid >= 100000 ? (amountToBid/100000).toFixed(2)+'L' : (amountToBid/1000).toFixed(0)+'k'}`
                            }
                          </button>
                          {canCustomBid && (
                            <button 
                              onClick={() => { setCustomBidTeamId(team.id); setCustomBidValue((currentBid + 1000).toString()); }}
                              className="w-9 h-10 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors hover:border-slate-500"
                              title="Custom Bid"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                       </>
                    )}
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