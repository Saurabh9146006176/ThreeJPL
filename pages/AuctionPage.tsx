import React, { useState, useEffect } from 'react';
import { Player, Team, AuctionSettings, ConfirmAction } from '../types';
import { canTeamBid, getNextBidAmount, calculateMaxBid } from '../utils/auctionLogic';
import { Gavel, CheckCircle, User, Shield, Edit3, X, RotateCcw, TrendingUp, SkipForward, AlertTriangle, ChevronRight, RefreshCcw } from 'lucide-react';
import { SoldCelebration } from '../components/SoldCelebration';

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
  // Use players array order for auction (allows Skip to move a player to the end)
  const [currentBid, setCurrentBid] = useState<number>(() => {
    // Pick first unsold player from the `players` prop order (will be initialized from App)
    const startPlayer = players.find(p => !p.isSold);
    return startPlayer ? (startPlayer.basePrice || settings.defaultBasePrice) : settings.defaultBasePrice;
  });
  const [leadingTeamId, setLeadingTeamId] = useState<string | null>(null);
  const [customBidTeamId, setCustomBidTeamId] = useState<string | null>(null);
  const [customBidValue, setCustomBidValue] = useState<string>('');
  
  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    player: Player;
    team: Team;
    price: number;
  } | null>(null);

  // Use the players array order for auction queue so `Skip` actually moves a player
  const sortedPlayers = [...players];
  const currentPlayer = sortedPlayers.find(p => !p.isSold);

  // Initialize bid when player loads
  useEffect(() => {
    if (currentPlayer) {
      // Use current basePrice from player (which should be updated by settings change)
      // Fallback to settings.defaultBasePrice if player.basePrice is 0 or undefined
      const initialBid = currentPlayer.basePrice || settings.defaultBasePrice;
      setCurrentBid(initialBid);
      setLeadingTeamId(null);
      setCustomBidTeamId(null);
    }
  }, [currentPlayer?.id, settings.defaultBasePrice]);

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
    const team = teams.find(t => t.id === leadingTeamId);
    if (!team) return;
    
    const teamName = team.name;
    confirmAction(
      'Confirm Sale', 
      `Sell ${currentPlayer.name} to ${teamName} for ₹${currentBid.toLocaleString()}?`,
      () => {
        // Show celebration instead of directly calling onPlayerSold
        setCelebrationData({
          player: currentPlayer,
          team: team,
          price: currentBid
        });
        setShowCelebration(true);
      }
    );
  };

  const handleCelebrationNext = () => {
    if (celebrationData) {
      // Actually complete the sale
      onPlayerSold(celebrationData.player.id, celebrationData.team.id, celebrationData.price);
      // Close celebration
      setShowCelebration(false);
      setCelebrationData(null);
    }
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
    <>
    <div className="flex flex-col lg:flex-row h-[calc(100vh-2.5rem)] gap-3 md:gap-4 overflow-hidden p-2 md:p-0">
      
      {/* 1. LEFT COLUMN: PLAYER CARD (50% Width) */}
      <div className="w-full lg:w-1/2 flex flex-col h-full shrink-0">
        <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden flex flex-col h-full relative shadow-2xl">
          
          {/* Header */}
          <div className="bg-slate-900/80 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center border-b border-white/5">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live</span>
             </div>
             <div className="text-[10px] font-mono text-cyan-400">#{currentPlayer.id.toString().toUpperCase().slice(-4)}</div>
          </div>

          {/* Photo & Name */}
          <div className="flex-1 flex flex-col items-center p-4 md:p-6 overflow-hidden relative justify-center">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 md:w-48 h-32 md:h-48 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none"></div>
             
             <div className="relative mb-2 md:mb-3 transform hover:scale-105 transition-transform duration-500 w-full flex justify-center">
               <div className="w-72 md:w-80 lg:w-96 rounded-2xl border-4 border-slate-800 bg-slate-900 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden max-h-[56vh] md:max-h-[60vh]">
                   {currentPlayer.photoUrl ? (
                     <img src={currentPlayer.photoUrl} className="w-full h-full object-cover max-h-[56vh] md:max-h-[60vh]" alt={currentPlayer.name} />
                   ) : (
                     <div className="text-slate-600 flex items-center justify-center h-full"><User size={96} /></div>
                   )}

                </div>
                {/* Team Logo Badge - Shows when team is leading */}
                {leadingTeam && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="bg-slate-900 border-4 border-slate-700 rounded-2xl p-3 shadow-2xl backdrop-blur-lg">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
                        {leadingTeam.logoUrl ? (
                          <img src={leadingTeam.logoUrl} className="w-full h-full object-cover" alt={leadingTeam.name} />
                        ) : (
                          <Shield size={40} className="text-slate-600" />
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs font-bold text-cyan-400 uppercase tracking-wide line-clamp-2">{leadingTeam.name}</p>
                      </div>
                    </div>
                  </div>
                )}
             </div>

             <div className="w-full max-w-3xl mx-auto mt-2 relative">
               <div className="absolute left-0 top-0">
                 <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-full text-xs md:text-sm uppercase font-bold">{currentPlayer.category}</span>
               </div>

               <h2 className="text-lg md:text-2xl lg:text-3xl font-black text-white text-center leading-tight mb-1.5 uppercase tracking-wide px-2">{currentPlayer.name}</h2>

               <div className="absolute right-0 top-0">
                 <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-full text-xs md:text-sm uppercase font-bold">{currentPlayer.experience}</span>
               </div>
             </div>

             {/* Pricing Block – Compact */}
             <div className="w-full mt-auto">
               <div className="flex justify-between items-center gap-2">

                 {/* BASE PRICE */}
                 <div className="flex-1 bg-slate-800/40 px-3 py-2 rounded-lg border border-white/5 flex items-center justify-between">
                   <span className="text-sm text-slate-400 font-bold">Base:</span>
                   <span className="text-sm md:text-base font-bold text-slate-300 font-mono">₹{(currentPlayer.basePrice || settings.defaultBasePrice).toLocaleString()}</span>
                 </div>

                 {/* CURRENT BID */}
                 <div className="flex-1 bg-gradient-to-b from-slate-800 to-slate-900 px-3 py-2 rounded-lg border border-cyan-500/20 flex items-center justify-between">
                   <span className="text-sm text-cyan-300 font-bold">Bid:</span>
                   <span className="text-lg md:text-2xl font-black text-white font-mono">₹{currentBid.toLocaleString()}</span>
                 </div>

               </div>
             </div>
          </div>

          {/* Footer Actions: Winning team, SOLD and SKIP on one line to maximize image space */}
          <div className="p-3 md:p-4 bg-slate-900/95 border-t border-white/5 z-10 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 bg-slate-800 p-2 rounded-lg">
                <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase ml-1">Winning Team:</span>
                {leadingTeam && leadingTeam.logoUrl && (
                  <div className="w-8 h-8 rounded-md bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={leadingTeam.logoUrl} className="w-full h-full object-cover" alt={leadingTeam.name} />
                  </div>
                )}
                {leadingTeam && !leadingTeam.logoUrl && (
                  <div className="w-8 h-8 rounded-md bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                    <Shield size={14} className="text-slate-600" />
                  </div>
                )}
                <span className={`font-bold text-sm truncate ${leadingTeam ? 'text-cyan-400' : 'text-slate-600'}`}>
                  {leadingTeam ? leadingTeam.name : 'Waiting for bid...'}
                </span>
              </div>

              <div className="flex-none">
                <button
                  onClick={handleSold}
                  disabled={!leadingTeamId}
                  className={`px-4 py-2 rounded-xl font-black text-xs md:text-sm uppercase tracking-widest shadow-lg flex items-center transition-all transform active:scale-95 ${
                    leadingTeamId
                      ? 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white shadow-green-900/30'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Gavel size={14} className="mr-2" /> SOLD
                </button>
              </div>

              <div className="flex-none flex items-center gap-2">
                <button onClick={handleSkip} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[9px] md:text-[10px] font-bold px-3 py-2 rounded-lg flex items-center justify-center border border-slate-700 transition-colors">
                  <SkipForward size={12} className="mr-1.5" /> SKIP
                </button>
                {canUndo && (
                  <button onClick={() => confirmAction('Undo?', "Undo last?", () => onUndoLastSold())} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[9px] md:text-[10px] font-bold px-3 py-2 rounded-lg flex items-center justify-center border border-slate-700 transition-colors">
                    <RotateCcw size={12} className="mr-1.5" /> UNDO
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RIGHT COLUMN: TEAMS GRID (50% Width) */}
      <div className="w-full lg:w-1/2 flex flex-col min-w-0 h-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 md:mb-4 px-1 shrink-0 bg-slate-900/60 p-3 md:p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
           <h3 className="text-slate-200 font-bold text-sm md:text-base flex items-center uppercase tracking-wider mb-2 md:mb-0">
             <TrendingUp size={18} className="mr-2 md:mr-3 text-cyan-500" /> 
             Active Bidders ({teams.length})
           </h3>
           <div className="flex items-center gap-2 md:gap-3">
             <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Next Bid:</span>
             <span className="text-sm md:text-base font-mono font-bold text-cyan-400 bg-cyan-950/40 px-3 md:px-4 py-1 md:py-1.5 rounded-lg border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
               ₹{amountToBid.toLocaleString()}
             </span>
           </div>
        </div>

        {/* Teams Grid - Non-scrollable for up to 10 teams */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 content-start overflow-hidden pr-1">
           {teams.map(team => {
             const rosterCount = team.playersBought.length + 2;
             const isFull = rosterCount >= settings.maxPlayersPerTeam;
             const isLeader = leadingTeamId === team.id;
             const validation = canTeamBid(team, amountToBid, settings);
             const canAffordNext = validation.allowed;
             const isCustomInputOpen = customBidTeamId === team.id;
             const maxBid = calculateMaxBid(team, settings);
             
             const canCustomBid = !isFull && (canAffordNext || team.purseRemaining > currentBid);

             return (
               <div 
                 key={team.id} 
                 className={`relative flex flex-col items-center justify-between p-3 md:p-4 rounded-xl border-2 transition-all duration-200 min-h-[140px] md:min-h-[155px] ${
                   isLeader 
                     ? 'bg-gradient-to-br from-slate-900 to-green-900/30 border-green-500/50 shadow-[0_0_25px_rgba(34,197,94,0.15)] scale-[1.02]' 
                     : !canAffordNext 
                       ? 'bg-slate-900/40 border-slate-800 opacity-60 grayscale' 
                       : 'bg-slate-800/40 border-white/5 hover:border-cyan-500/30 hover:bg-slate-800/80 hover:shadow-lg'
                 }`}
               >
                 {isLeader && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-2xl"></div>}

                 {/* Custom Bid Button - Small, positioned in top-right corner */}
                 {canCustomBid && !isCustomInputOpen && (
                   <button 
                     onClick={() => { setCustomBidTeamId(team.id); setCustomBidValue((currentBid + 1000).toString()); }}
                     className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-slate-800/80 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors hover:border-slate-500 z-10"
                     title="Custom Bid"
                   >
                     <Edit3 size={10} />
                   </button>
                 )}

                 {/* Team Logo & Name */}
                 <div className="flex flex-col items-center gap-2 md:gap-2.5 flex-1 justify-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-cover" /> : <Shield size={18} className="text-slate-600" />}
                    </div>
                    <h4 className={`font-bold text-xs md:text-sm text-center leading-tight max-w-full px-1 ${isLeader ? 'text-green-400' : 'text-slate-200'} line-clamp-2`}>{team.name}</h4>
                 </div>

                 {/* Bid Actions */}
                 <div className="w-full mt-2 md:mt-2.5">
                    {isCustomInputOpen ? (
                       <div className="flex gap-1">
                          <input 
                            type="number" autoFocus
                            className="flex-1 bg-slate-900 border border-cyan-500/50 rounded-lg px-1.5 font-mono text-white text-[10px] h-7 outline-none shadow-inner"
                            value={customBidValue} onChange={(e) => setCustomBidValue(e.target.value)}
                          />
                          <button onClick={() => { const val = Number(customBidValue); if(val >= currentBid) handleBid(team, val); }} className="bg-cyan-600 text-white px-1.5 rounded-lg h-7 hover:bg-cyan-500 text-[10px] font-bold shadow-lg shadow-cyan-900/20">✓</button>
                          <button onClick={() => setCustomBidTeamId(null)} className="bg-slate-700 text-slate-400 px-1.5 rounded-lg h-7 hover:bg-slate-600"><X size={10} /></button>
                       </div>
                    ) : (
                       <button
                         disabled={!canAffordNext}
                         onClick={() => handleBid(team, amountToBid)}
                         className={`w-full h-7 md:h-8 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wide transition-all active:scale-95 shadow-md flex items-center justify-center ${
                           !canAffordNext
                             ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-700'
                             : isLeader
                               ? 'bg-slate-800 text-green-500 cursor-default border border-green-500/30 shadow-none'
                               : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 shadow-blue-900/20 hover:shadow-blue-500/30'
                         }`}
                       >
                         {!canAffordNext 
                           ? (isFull ? 'Full' : 'No Funds')
                           : isLeader 
                              ? 'Leading' 
                              : `BID ${amountToBid >= 100000 ? (amountToBid/100000).toFixed(2)+'L' : (amountToBid/1000).toFixed(0)+'k'}`
                         }
                       </button>
                    )}
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>

    {/* Sold Celebration Overlay */}
    {showCelebration && celebrationData && (
      <SoldCelebration
        player={celebrationData.player}
        team={celebrationData.team}
        price={celebrationData.price}
        onNext={handleCelebrationNext}
        nextPlayer={sortedPlayers.find(p => !p.isSold && p.id !== celebrationData.player.id)}
      />
    )}
    </>
  );
};