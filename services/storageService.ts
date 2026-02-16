import { Team, Player, AuctionSettings } from '../types';
import { INITIAL_TEAMS, INITIAL_PLAYERS, DEFAULT_SETTINGS } from '../constants';

const API_BASE_URL = 'https://us-central1-axilam.cloudfunctions.net/api';

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
    const email = getCurrentUserEmail();
    if (!email) throw new Error('User not authenticated');
    
    const response = await fetch(`${API_BASE_URL}/teams?email=${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('Failed to load teams');
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Error loading teams", e);
    return INITIAL_TEAMS;
  }
};

export const saveTeams = async (teams: Team[]) => {
  try {
    const email = getCurrentUserEmail();
    if (!email) throw new Error('User not authenticated');
    
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, data: teams })
    });
    if (!response.ok) throw new Error('Failed to save teams');
  } catch (e) {
    console.error("Error saving teams", e);
  }
};

export const loadPlayers = async (): Promise<Player[]> => {
  try {
    const email = getCurrentUserEmail();
    if (!email) throw new Error('User not authenticated');
    
    const response = await fetch(`${API_BASE_URL}/players?email=${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('Failed to load players');
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Error loading players", e);
    return INITIAL_PLAYERS;
  }
};

export const savePlayers = async (players: Player[]) => {
  try {
    const email = getCurrentUserEmail();
    if (!email) throw new Error('User not authenticated');
    
    const response = await fetch(`${API_BASE_URL}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, data: players })
    });
    if (!response.ok) throw new Error('Failed to save players');
  } catch (e) {
    console.error("Error saving players", e);
  }
};

export const loadSettings = async (): Promise<AuctionSettings> => {
  try {
    const email = getCurrentUserEmail();
    if (!email) throw new Error('User not authenticated');
    
    const response = await fetch(`${API_BASE_URL}/settings?email=${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('Failed to load settings');
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Error loading settings", e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: AuctionSettings) => {
  try {
    const email = getCurrentUserEmail();
    if (!email) throw new Error('User not authenticated');
    
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, data: settings })
    });
    if (!response.ok) throw new Error('Failed to save settings');
  } catch (e) {
    console.error("Error saving settings", e);
  }
};

export const resetData = async () => {
  try {
    await saveTeams(INITIAL_TEAMS);
    await savePlayers(INITIAL_PLAYERS);
    await saveSettings(DEFAULT_SETTINGS);
  } catch (e) {
    console.error("Error resetting data", e);
  }
  window.location.reload();
};

// Authentication functions
export const register = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');
    return data;
  } catch (e) {
    console.error("Error registering", e);
    throw e;
  }
};

export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    return data;
  } catch (e) {
    console.error("Error logging in", e);
    throw e;
  }
};

export const logout = () => {
  localStorage.removeItem('auction_auth_token');
  localStorage.removeItem('auction_user_email');
  localStorage.removeItem('auction_user_role');
};

export const getCurrentUserEmail = () => {
  return localStorage.getItem('auction_user_email');
};

export const getCurrentUserRole = () => {
  return localStorage.getItem('auction_user_role') || 'user';
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('auction_auth_token');
};

// Admin functions
export const getAccessRequests = async (adminEmail: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/access-requests?admin_email=${encodeURIComponent(adminEmail)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get access requests');
    return data.requests;
  } catch (e) {
    console.error("Error getting access requests", e);
    throw e;
  }
};

export const approveAccess = async (adminEmail: string, userEmail: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/approve-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_email: adminEmail, user_email: userEmail })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to approve access');
    return data;
  } catch (e) {
    console.error("Error approving access", e);
    throw e;
  }
};

export const denyAccess = async (adminEmail: string, userEmail: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/deny-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_email: adminEmail, user_email: userEmail })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to deny access');
    return data;
  } catch (e) {
    console.error("Error denying access", e);
    throw e;
  }
};