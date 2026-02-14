import React, { useRef } from 'react';
import { ViewState, Team, Player, AuctionSettings, ConfirmAction, PlayerRole, ExperienceLevel } from '../types';
import { Gavel, Users, User, LayoutDashboard, Download, Upload, Trash2, Settings, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { exportDataToJSON, resetData } from '../services/storageService';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  teams: Team[];
  players: Player[];
  settings: AuctionSettings;
  onImport: (data: { teams: Team[], players: Player[], settings: AuctionSettings }) => void;
  confirmAction: ConfirmAction;
  onLogout: () => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  teams, 
  players, 
  settings, 
  onImport, 
  confirmAction, 
  onLogout,
  isCollapsed, 
  toggleSidebar
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItemClass = (view: ViewState) =>
    `flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer font-medium mb-2 group ${
      currentView === view
        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
    }`;

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawData = JSON.parse(event.target?.result as string);
        
        let newPlayers: Player[] = [];
        let newTeams: Team[] = [];
        let newSettings: AuctionSettings | null = null;
        let isFullBackup = false;
        let importType = 'unknown';

        let rawPlayerList: any[] = [];
        let rawTeamList: any[] = [];

        // --- 1. Detect JSON Structure ---
        
        // Case A: It's a flat array
        if (Array.isArray(rawData)) {
           if (rawData.length > 0) {
             // Heuristic: Check if first item looks like a Team or a Player
             const sample = rawData[0];
             if (sample.purseRemaining !== undefined || sample.captainName !== undefined || sample.logoColor !== undefined) {
               // Likely a Team Array
               rawTeamList = rawData;
               importType = 'team_array';
             } else {
               // Likely a Player Array
               rawPlayerList = rawData;
               importType = 'player_array';
             }
           } else {
             // Empty array
             alert("File contains an empty array.");
             return;
           }
           isFullBackup = false;
        } 
        // Case B: It's the standard app export or wrapped object
        else if (typeof rawData === 'object' && rawData !== null) {
          // Check for full backup signatures
          if (Array.isArray(rawData.teams) || (rawData.settings && typeof rawData.settings === 'object')) {
            isFullBackup = true;
            importType = 'full_backup';
          }

          if (Array.isArray(rawData.players)) {
            rawPlayerList = rawData.players;
          } else if (Array.isArray(rawData['Form Responses 1'])) {
            // Handle common sheet export structure
            rawPlayerList = rawData['Form Responses 1'];
            importType = 'google_sheet';
            isFullBackup = false; // Treat sheet exports as data append usually
          }

          if (Array.isArray(rawData.teams)) {
            rawTeamList = rawData.teams;
          }

          if (rawData.settings && typeof rawData.settings === 'object') {
            newSettings = { ...settings, ...rawData.settings };
          }
        }

        // --- 2. Process Teams ---
        if (rawTeamList.length > 0) {
          newTeams = rawTeamList.map((t: any, index: number) => ({
            id: t.id ? String(t.id) : `t_imp_${Date.now()}_${index}`,
            name: t.name || `Team ${index + 1}`,
            logoUrl: t.logoUrl || '',
            captainName: t.captainName || 'TBD',
            captainPhotoUrl: t.captainPhotoUrl || '',
            viceCaptainName: t.viceCaptainName,
            viceCaptainMobile: t.viceCaptainMobile,
            viceCaptainPhotoUrl: t.viceCaptainPhotoUrl,
            captainMobile: t.captainMobile,
            logoColor: t.logoColor || 'bg-blue-500',
            purseRemaining: t.purseRemaining !== undefined ? Number(t.purseRemaining) : settings.totalPurse,
            playersBought: Array.isArray(t.playersBought) ? t.playersBought.map(String) : []
          }));
        }

        // --- 3. Process Players (Google Form Support) ---
        if (rawPlayerList.length > 0) {
          newPlayers = rawPlayerList.map((p: any, index: number) => {
            // Map Google Form specific keys to App keys
            const name = p.name || p['Player Full Name'] || 'Unknown Player';
            const mobile = p.mobileNumber || p['Player Mobile Number'] || 'N/A';
            
            // Map Role
            let category: PlayerRole = 'All Rounder';
            const rawRole = p.category || p['Player Role'];
            if (rawRole) {
               if (rawRole.includes('Right Handed')) category = 'Right Handed Batsman';
               else if (rawRole.includes('Left Handed')) category = 'Left Handed Batsman';
               else if (rawRole.includes('Bowler')) category = 'Bowler';
               else if (rawRole.includes('Wicket')) category = 'Wicket Keeper';
               else category = 'All Rounder';
            }

            // Map Experience
            let experience: ExperienceLevel = 'Intermediate';
            const rawExp = p.experience || p['Experience Level'];
            if (rawExp) {
               if (rawExp.includes('Beginner')) experience = 'Beginner';
               else if (rawExp.includes('Advance')) experience = 'Advance';
               else experience = 'Intermediate';
            }

            // Map Photo
            const photoUrl = p.photoUrl || p['Players Photo'] || '';

            // Handle Base Price (check various keys or default)
            let price = (newSettings || settings).defaultBasePrice;
            if (p.basePrice !== undefined) price = Number(p.basePrice);
            else if (p['Base Price'] !== undefined) price = Number(p['Base Price']);

            return {
              id: p.id ? String(p.id) : `p_imp_${Date.now()}_${index}`, // Force ID to String
              name: name,
              mobileNumber: String(mobile), // Force string
              category: category,
              experience: experience,
              photoUrl: photoUrl,
              basePrice: price,
              isSold: p.isSold !== undefined ? p.isSold : false,
              soldToTeamId: p.soldToTeamId ? String(p.soldToTeamId) : undefined,
              soldPrice: p.soldPrice
            };
          });
        }

        // --- 4. Determine Action ---
        let finalPlayers = players;
        let finalTeams = teams;
        let finalSettings = settings;
        let message = '';
        let title = '';

        if (importType === 'team_array') {
           title = 'Import Teams?';
           message = `Found ${newTeams.length} teams in the file.\n\nThis will APPEND them to your existing list.`;
           if (newTeams.length > 0) finalTeams = [...teams, ...newTeams];
        } else if (importType === 'player_array' || importType === 'google_sheet') {
           title = 'Import Players?';
           message = `Found ${newPlayers.length} players in the file.\n\nThis will APPEND them to your existing roster.`;
           if (newPlayers.length > 0) finalPlayers = [...players, ...newPlayers];
        } else if (importType === 'full_backup') {
           title = 'Restore Backup?';
           message = `Found a full backup containing:\n` + 
                    (newTeams.length ? `- ${newTeams.length} Teams\n` : '') +
                    (newPlayers.length ? `- ${newPlayers.length} Players\n` : '') +
                    (newSettings ? `- System Settings\n` : '') +
                    `\nWARNING: This will REPLACE all current data.`;
           if (newTeams.length > 0) finalTeams = newTeams;
           if (newPlayers.length > 0) finalPlayers = newPlayers;
           if (newSettings) finalSettings = newSettings;
        }

        if (newPlayers.length > 0 || newTeams.length > 0 || newSettings) {
          confirmAction(title, message, () => {
             onImport({ 
              teams: finalTeams, 
              players: finalPlayers, 
              settings: finalSettings 
            });
          });
        } else {
          alert("No valid data found in JSON.");
        }

      } catch (err) {
        console.error(err);
        alert("Failed to parse JSON file. Please ensure it is a valid JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    confirmAction(
      'Reset Database?', 
      'Are you sure you want to delete ALL local data? This action cannot be undone and will revert the application to its initial state.',
      () => resetData()
    );
  };

  const handleLogoutAction = () => {
    confirmAction(
        'Logout?',
        'Are you sure you want to exit the secure session?',
        () => onLogout()
    );
  };

  return (
    <div 
      className={`${isCollapsed ? 'w-20' : 'w-64'} glass-panel border-r border-white/5 min-h-screen flex flex-col transition-all duration-300 fixed left-0 top-0 z-50`}
    >
      {/* Hidden Input outside conditional rendering */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".json" 
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="h-24 flex items-center justify-center relative border-b border-white/5">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2 rounded-lg shadow-lg">
              <Gavel className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-wider text-white">AUCTION<span className="text-cyan-400">EER</span></h1>
              <p className="text-[10px] text-slate-500 tracking-widest uppercase">Pro Edition</p>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2 rounded-lg shadow-lg">
             <Gavel className="h-8 w-8 text-white" />
          </div>
        )}
        
        <button 
          onClick={toggleSidebar} 
          className="absolute -right-3 top-9 bg-slate-800 text-slate-400 border border-slate-700 p-1 rounded-full hover:text-white transition-colors shadow-md"
        >
           {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 overflow-y-auto space-y-1">
        <p className={`text-xs font-bold text-slate-600 uppercase tracking-widest mb-4 px-2 ${isCollapsed ? 'text-center' : ''}`}>
           {isCollapsed ? 'Menu' : 'Main Menu'}
        </p>
        
        <button onClick={() => setView('DASHBOARD')} className={navItemClass('DASHBOARD')}>
          <LayoutDashboard size={20} className={currentView === 'DASHBOARD' ? 'text-cyan-400' : 'group-hover:text-white'} />
          {!isCollapsed && <span>Dashboard</span>}
        </button>
        <button onClick={() => setView('TEAMS')} className={navItemClass('TEAMS')}>
          <Users size={20} className={currentView === 'TEAMS' ? 'text-cyan-400' : 'group-hover:text-white'} />
          {!isCollapsed && <span>Teams</span>}
        </button>
        <button onClick={() => setView('PLAYERS')} className={navItemClass('PLAYERS')}>
          <User size={20} className={currentView === 'PLAYERS' ? 'text-cyan-400' : 'group-hover:text-white'} />
          {!isCollapsed && <span>Players</span>}
        </button>
        <button onClick={() => setView('AUCTION')} className={navItemClass('AUCTION')}>
          <div className="relative">
             <Gavel size={20} className={currentView === 'AUCTION' ? 'text-cyan-400' : 'group-hover:text-white'} />
             <span className="absolute -top-1 -right-1 flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
             </span>
          </div>
          {!isCollapsed && <span>Live Auction</span>}
        </button>
        
        <div className="my-6 border-t border-white/5 mx-2"></div>

        <p className={`text-xs font-bold text-slate-600 uppercase tracking-widest mb-4 px-2 ${isCollapsed ? 'text-center' : ''}`}>
           {isCollapsed ? 'Sys' : 'System'}
        </p>

        <button onClick={() => setView('SETTINGS')} className={navItemClass('SETTINGS')}>
          <Settings size={20} className={currentView === 'SETTINGS' ? 'text-cyan-400' : 'group-hover:text-white'} />
          {!isCollapsed && <span>Configuration</span>}
        </button>
      </nav>

      {/* Footer / Data Actions */}
      <div className="p-4 border-t border-white/5 bg-slate-900/50 backdrop-blur-md">
        {!isCollapsed ? (
          <div className="space-y-3">
             <div className="grid grid-cols-4 gap-1">
                <button 
                  onClick={handleImportClick}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-[10px] text-slate-400 hover:text-white transition-all"
                  title="Import Data"
                >
                  <Upload size={14} className="mb-1 text-blue-400" />
                  Import
                </button>
                <button 
                  onClick={() => exportDataToJSON(teams, players, settings)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-[10px] text-slate-400 hover:text-white transition-all"
                  title="Export Backup"
                >
                  <Download size={14} className="mb-1 text-green-400" />
                  Export
                </button>
                <button 
                  onClick={handleReset}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-red-900/20 hover:border-red-800 text-[10px] text-slate-400 hover:text-red-400 transition-all"
                  title="Reset Data"
                >
                   <Trash2 size={14} className="mb-1 text-red-500" />
                   Reset
                </button>
                <button 
                  onClick={handleLogoutAction}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-[10px] text-slate-400 hover:text-white transition-all"
                  title="Logout"
                >
                   <LogOut size={14} className="mb-1 text-slate-300" />
                   Exit
                </button>
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
             <button onClick={() => exportDataToJSON(teams, players, settings)} title="Export">
               <Download size={18} className="text-slate-400 hover:text-white" />
             </button>
             <button onClick={handleLogoutAction} title="Logout">
               <LogOut size={18} className="text-slate-500 hover:text-white" />
             </button>
          </div>
        )}
      </div>
    </div>
  );
};