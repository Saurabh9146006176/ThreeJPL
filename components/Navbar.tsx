import React, { useRef } from 'react';
import { ViewState, Team, Player, AuctionSettings } from '../types';
import { Gavel, Users, User, LayoutDashboard, Download, Upload, Trash2 } from 'lucide-react';
import { exportDataToJSON, resetData } from '../services/storageService';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  teams: Team[];
  players: Player[];
  settings: AuctionSettings;
  onImport: (data: { teams: Team[], players: Player[] }) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, teams, players, settings, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItemClass = (view: ViewState) =>
    `flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm font-medium ${
      currentView === view
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.teams && json.players) {
          if (window.confirm(`Found ${json.teams.length} teams and ${json.players.length} players. Import? Current data will be replaced.`)) {
            onImport({ teams: json.teams, players: json.players });
          }
        } else {
          alert("Invalid JSON format. Expected keys: 'teams' and 'players'.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to delete all local data? This cannot be undone.')) {
      resetData();
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Gavel className="h-7 w-7 text-blue-600 mr-2" />
            <span className="text-xl font-bold text-gray-900 tracking-tight">Auctioneer</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            <button onClick={() => setView('DASHBOARD')} className={navItemClass('DASHBOARD')}>
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>
            <button onClick={() => setView('TEAMS')} className={navItemClass('TEAMS')}>
              <Users size={16} />
              <span>Teams</span>
            </button>
            <button onClick={() => setView('PLAYERS')} className={navItemClass('PLAYERS')}>
              <User size={16} />
              <span>Players</span>
            </button>
            <button onClick={() => setView('AUCTION')} className={navItemClass('AUCTION')}>
              <Gavel size={16} />
              <span>Auction</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleFileChange}
            />
            <button 
              onClick={handleImportClick}
              className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100"
              title="Import JSON"
            >
              <Upload size={20} />
            </button>
            <button 
              onClick={() => exportDataToJSON(teams, players, settings)}
              className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100"
              title="Export JSON"
            >
              <Download size={20} />
            </button>
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
             <button 
              onClick={handleReset}
              className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50"
              title="Reset Database"
            >
               <Trash2 size={20} />
             </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu (simplified) */}
      <div className="md:hidden flex justify-around py-2 border-t text-xs">
          <button onClick={() => setView('DASHBOARD')} className="p-2">Dash</button>
          <button onClick={() => setView('TEAMS')} className="p-2">Teams</button>
          <button onClick={() => setView('PLAYERS')} className="p-2">Players</button>
          <button onClick={() => setView('AUCTION')} className="p-2">Auction</button>
      </div>
    </nav>
  );
};