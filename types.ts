export type PlayerRole = 'Right Handed Batsman' | 'Left Handed Batsman' | 'Bowler' | 'All Rounder' | 'Wicket Keeper';
export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advance';

export interface Player {
  id: string;
  name: string;
  mobileNumber: string;
  category: PlayerRole;
  experience: ExperienceLevel;
  photoUrl?: string; // Base64 string
  basePrice: number;
  isSold: boolean;
  soldToTeamId?: string;
  soldPrice?: number;
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string; // Base64 string
  logoColor: string; // Fallback color
  purseRemaining: number;
  playersBought: string[]; // Array of Player IDs bought in Auction
  
  // Fixed Player 1 (Captain)
  captainName: string;
  captainMobile?: string;
  captainPhotoUrl?: string;

  // Fixed Player 2 (Key Player / Vice Captain)
  viceCaptainName?: string;
  viceCaptainMobile?: string;
  viceCaptainPhotoUrl?: string;
}

export interface AuctionSettings {
  maxPlayersPerTeam: number;
  totalPurse: number;
  defaultBasePrice: number;
  // Bid Slabs
  bidIncrement1: number; // For bids < 2 Lakh
  bidIncrement2: number; // For bids 2L - 5L
  bidIncrement3: number; // For bids > 5L
}

export type ViewState = 'DASHBOARD' | 'TEAMS' | 'PLAYERS' | 'AUCTION' | 'SETTINGS';

export interface AuctionState {
  currentPlayerId: string | null;
  currentBid: number;
  leadingTeamId: string | null;
}

export type ConfirmAction = (title: string, message: string, onConfirm: () => void) => void;