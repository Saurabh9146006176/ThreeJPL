import React, { useState, useEffect } from 'react';
import { ViewState, Team, Player, AuctionSettings, ConfirmAction } from './types';
import { loadTeams, loadPlayers, loadSettings, saveTeams, savePlayers, saveSettings } from './services/storageService';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { TeamsPage } from './pages/TeamsPage';
import { PlayersPage } from './pages/PlayersPage';
import { AuctionPage } from './pages/AuctionPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { ConfirmationModal } from './components/ConfirmationModal';
import { DEFAULT_SETTINGS, DEMO_TEAMS, DEMO_PLAYERS } from './constants';

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // App Data State
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<AuctionSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  
  // History stack for Undo functionality
  const [history, setHistory] = useState<Array<{playerId: string, teamId: string, price: number}>>([]);

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const confirmAction: ConfirmAction = (title, message, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Check Authentication on Mount
  useEffect(() => {
    const authSession = localStorage.getItem('auction_auth_token');
    if (authSession === 'valid_session') {
      setIsAuthenticated(true);
    }
    setAuthChecked(true);
  }, []);

  // Load Data on Mount
  useEffect(() => {
    const loadData = async () => {
      const loadedTeams = await loadTeams();
      const loadedPlayers = await loadPlayers();
      const loadedSettings = await loadSettings();
      
      setTeams(loadedTeams);
      setPlayers(loadedPlayers);
      setSettings(loadedSettings);
      
      setLoading(false);
    };
    loadData();
  }, []);

  // Save Data whenever it changes, but ONLY after loading is complete
  useEffect(() => {
    if (!loading) {
      const saveData = async () => {
        await saveTeams(teams);
        await savePlayers(players);
        await saveSettings(settings);
      };
      saveData();
    }
  }, [teams, players, settings, loading]);

  const handleLogin = (email: string, password: string): boolean => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    if (cleanEmail === 'chetan2469@gmail.com' && cleanPassword === 'Ux9146CT') {
      setIsAuthenticated(true);
      localStorage.setItem('auction_auth_token', 'valid_session');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auction_auth_token');
  };

  const handleUpdateTeam = (updatedTeam: Team) => {
    setTeams(teams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
  };

  const handleAddTeam = (newTeam: Team) => {
    setTeams([...teams, newTeam]);
  };

  const handleDeleteTeam = (id: string) => {
    setTeams(teams.filter(t => t.id !== id));
  };

  const handleAddPlayer = (newPlayer: Player) => {
    setPlayers([...players, newPlayer]);
  };

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    setPlayers(players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
  };

  const handleDeletePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const handleUpdateSettings = (newSettings: AuctionSettings) => {
    setSettings(newSettings);
  };

  const handleImport = (data: { teams: Team[], players: Player[], settings: AuctionSettings }) => {
    setTeams(data.teams);
    setPlayers(data.players);
    setSettings(data.settings);
    setHistory([]); 
    alert('Data imported successfully!');
  };

  const handleLoadDemo = () => {
    setTeams(DEMO_TEAMS);
    setPlayers(DEMO_PLAYERS);
    setSettings(DEFAULT_SETTINGS);
    setHistory([]);
    alert('Demo data loaded!');
  };

  const handlePlayerSold = (playerId: string, teamId: string, price: number) => {
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...p, isSold: true, soldToTeamId: teamId, soldPrice: price } : p
    );
    setPlayers(updatedPlayers);

    const updatedTeams = teams.map(t => 
      t.id === teamId 
        ? { 
            ...t, 
            purseRemaining: t.purseRemaining - price, 
            playersBought: [...t.playersBought, playerId] 
          }
        : t
    );
    setTeams(updatedTeams);

    setHistory([...history, { playerId, teamId, price }]);
  };

  const handleUndoLastSold = () => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    
    setPlayers(players.map(p => 
      p.id === lastAction.playerId 
        ? { ...p, isSold: false, soldToTeamId: undefined, soldPrice: undefined }
        : p
    ));

    setTeams(teams.map(t => 
      t.id === lastAction.teamId
        ? {
            ...t,
            purseRemaining: t.purseRemaining + lastAction.price,
            playersBought: t.playersBought.filter(id => id !== lastAction.playerId)
          }
        : t
    ));

    setHistory(history.slice(0, -1));
  };

  const handleSkipPlayer = (playerId: string) => {
    const index = players.findIndex(p => p.id === playerId);
    if (index === -1) return;
    const newPlayers = [...players];
    const [skipped] = newPlayers.splice(index, 1);
    newPlayers.push(skipped);
    setPlayers(newPlayers);
  };

  if (!authChecked || loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-cyan-500">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-xl font-bold tracking-widest uppercase">Initializing System...</div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200">
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />

      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        teams={teams}
        players={players}
        settings={settings}
        onImport={handleImport}
        confirmAction={confirmAction}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={`flex-1 p-4 transition-all duration-300 relative overflow-hidden ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="absolute top-0 left-0 w-full h-96 bg-cyan-500/5 blur-[100px] pointer-events-none rounded-full transform -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-full h-96 bg-purple-500/5 blur-[100px] pointer-events-none rounded-full transform translate-y-1/2"></div>

        <div className="max-w-[1920px] mx-auto relative z-10 h-full">
          {currentView === 'DASHBOARD' && (
            <Dashboard teams={teams} players={players} settings={settings} />
          )}
          
          {currentView === 'TEAMS' && (
            <TeamsPage 
              teams={teams} 
              players={players}
              setPlayers={setPlayers} 
              settings={settings}
              onUpdateTeam={handleUpdateTeam}
              onAddTeam={handleAddTeam}
              onDeleteTeam={handleDeleteTeam}
              confirmAction={confirmAction}
            />
          )}
          
          {currentView === 'PLAYERS' && (
            <PlayersPage 
              players={players}
              setPlayers={setPlayers}
              settings={settings}
              onAddPlayer={handleAddPlayer}
              onUpdatePlayer={handleUpdatePlayer}
              onDeletePlayer={handleDeletePlayer}
              confirmAction={confirmAction}
            />
          )}
          
          {currentView === 'AUCTION' && (
            <AuctionPage 
              teams={teams} 
              players={players}
              settings={settings}
              onPlayerSold={handlePlayerSold}
              onUndoLastSold={handleUndoLastSold}
              canUndo={history.length > 0}
              onSkipPlayer={handleSkipPlayer}
              confirmAction={confirmAction}
            />
          )}

          {currentView === 'SETTINGS' && (
            <SettingsPage 
              settings={settings}
              onSave={handleUpdateSettings}
              onLoadDemoData={handleLoadDemo}
              confirmAction={confirmAction}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;