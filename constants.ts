import { Player, Team, AuctionSettings } from './types';

// Default Business Rules (Used if no settings found)
export const DEFAULT_SETTINGS: AuctionSettings = {
  maxPlayersPerTeam: 9, // Updated to 9 players (Squad Size)
  totalPurse: 1000000, // 10 Lakhs
  defaultBasePrice: 30000,
  bidIncrement1: 10000, // < 2L
  bidIncrement2: 20000, // 2L - 5L
  bidIncrement3: 30000, // > 5L
};

// Initial Data
export const INITIAL_TEAMS: Team[] = [];
export const INITIAL_PLAYERS: Player[] = [];

export const DEMO_TEAMS: Team[] = [
  {
    id: 't_demo_1',
    name: 'Cyber Titans',
    captainName: 'Alex M',
    purseRemaining: 1000000,
    playersBought: [],
    logoColor: 'bg-cyan-500'
  },
  {
    id: 't_demo_2',
    name: 'Neon Warriors',
    captainName: 'Sarah K',
    purseRemaining: 1000000,
    playersBought: [],
    logoColor: 'bg-purple-500'
  },
  {
    id: 't_demo_3',
    name: 'Stealth Strikers',
    captainName: 'Mike R',
    purseRemaining: 1000000,
    playersBought: [],
    logoColor: 'bg-green-500'
  }
];

export const DEMO_PLAYERS: Player[] = [
  { id: 'p_d1', name: 'John Doe', mobileNumber: '9998887771', category: 'All Rounder', experience: 'Advance', basePrice: 50000, isSold: false },
  { id: 'p_d2', name: 'Jane Smith', mobileNumber: '9998887772', category: 'Bowler', experience: 'Intermediate', basePrice: 30000, isSold: false },
  { id: 'p_d3', name: 'Robert P', mobileNumber: '9998887773', category: 'Right Handed Batsman', experience: 'Advance', basePrice: 40000, isSold: false },
  { id: 'p_d4', name: 'Chris Evans', mobileNumber: '9998887774', category: 'Wicket Keeper', experience: 'Beginner', basePrice: 20000, isSold: false },
  { id: 'p_d5', name: 'Tom H', mobileNumber: '9998887775', category: 'Left Handed Batsman', experience: 'Intermediate', basePrice: 30000, isSold: false },
  { id: 'p_d6', name: 'Scarlett J', mobileNumber: '9998887776', category: 'All Rounder', experience: 'Advance', basePrice: 50000, isSold: false },
];