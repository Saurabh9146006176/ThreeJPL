import { Team, Player, AuctionSettings } from '../types';
import { INITIAL_TEAMS, INITIAL_PLAYERS, DEFAULT_SETTINGS } from '../constants';

const API_BASE_URL = 'https://api-grsqjakhza-uc.a.run.app';

// Helper to download data as JSON file
export const exportDataToJSON = async (teams: Team[], players: Player[], settings: AuctionSettings) => {
  const data = {
    teams,
    players,
    settings,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `auction_data_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Helper to import data from JSON file
export const importDataFromJSON = async (jsonString: string): Promise<{ teams: Team[], players: Player[], settings: AuctionSettings } | null> => {
  try {
    const data = JSON.parse(jsonString);
    if (data.teams && Array.isArray(data.teams) &&
        data.players && Array.isArray(data.players) &&
        data.settings && typeof data.settings === 'object') {
      
      // Save to API
      await saveTeams(data.teams);
      await savePlayers(data.players);
      await saveSettings(data.settings);
      
      return {
        teams: data.teams,
        players: data.players,
        settings: data.settings
      };
    }
    return null;
  } catch (e) {
    console.error("Error importing data", e);
    return null;
  }
};

export const loadTeams = async (): Promise<Team[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams`);
    if (!response.ok) throw new Error('Failed to load teams');
    return await response.json();
  } catch (e) {
    console.error("Error loading teams", e);
    return INITIAL_TEAMS;
  }
};

export const saveTeams = async (teams: Team[]) => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teams)
    });
    if (!response.ok) throw new Error('Failed to save teams');
  } catch (e) {
    console.error("Error saving teams", e);
  }
};

export const loadPlayers = async (): Promise<Player[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/players`);
    if (!response.ok) throw new Error('Failed to load players');
    return await response.json();
  } catch (e) {
    console.error("Error loading players", e);
    return INITIAL_PLAYERS;
  }
};

export const savePlayers = async (players: Player[]) => {
  try {
    const response = await fetch(`${API_BASE_URL}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(players)
    });
    if (!response.ok) throw new Error('Failed to save players');
  } catch (e) {
    console.error("Error saving players", e);
  }
};

export const loadSettings = async (): Promise<AuctionSettings> => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`);
    if (!response.ok) throw new Error('Failed to load settings');
    return await response.json();
  } catch (e) {
    console.error("Error loading settings", e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: AuctionSettings) => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Failed to save settings');
  } catch (e) {
    console.error("Error saving settings", e);
  }
};

export const resetData = async () => {
  await saveTeams(INITIAL_TEAMS);
  await savePlayers(INITIAL_PLAYERS);
  await saveSettings(DEFAULT_SETTINGS);
  window.location.reload();
};