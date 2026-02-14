import { Team, AuctionSettings } from '../types';

/**
 * Calculates the safe maximum bid a team *should* place.
 */
export const calculateMaxBid = (team: Team, settings: AuctionSettings): number => {
  // Roster count = Players Bought + 2 Fixed Players
  const currentCount = team.playersBought.length + 2;
  const maxPlayers = settings.maxPlayersPerTeam;
  const basePrice = settings.defaultBasePrice;
  
  // If team is full, they can't bid
  if (currentCount >= maxPlayers) {
    return 0;
  }

  const remainingSlotsTotal = maxPlayers - currentCount;
  
  // We are calculating max bid for ONE player right now.
  // We need to reserve money for (RemainingSlots - 1) other players.
  const slotsToReserve = remainingSlotsTotal - 1;
  const minimumReservedPurse = slotsToReserve * basePrice;

  const maxBidAllowed = team.purseRemaining - minimumReservedPurse;

  return Math.max(0, maxBidAllowed);
};

export const canTeamBid = (team: Team, bidAmount: number, settings: AuctionSettings): { allowed: boolean; reason?: string } => {
  // Roster count = Players Bought + 2 Fixed Players
  const currentCount = team.playersBought.length + 2;

  if (currentCount >= settings.maxPlayersPerTeam) {
    return { allowed: false, reason: 'Squad Full' };
  }

  // 1. Basic Check: Do they have the money?
  if (bidAmount > team.purseRemaining) {
    return { allowed: false, reason: 'No Funds' };
  }

  // 2. Stopper Check: If they bid this amount, will they have enough left for the REST of the squad?
  const maxPlayers = settings.maxPlayersPerTeam;
  const basePrice = settings.defaultBasePrice;
  const remainingSlotsAfterThisBid = (maxPlayers - currentCount) - 1; // -1 because this bid fills one slot
  
  if (remainingSlotsAfterThisBid > 0) {
    const moneyNeededLater = remainingSlotsAfterThisBid * basePrice;
    const moneyLeftAfterBid = team.purseRemaining - bidAmount;

    if (moneyLeftAfterBid < moneyNeededLater) {
      return { allowed: false, reason: 'Exceeds Safe Limit' }; // This stops the "Custom Bid" exploit
    }
  }

  return { allowed: true };
};

/**
 * Calculates next bid based on configured slabs
 */
export const getNextBidAmount = (currentBid: number, settings: AuctionSettings): number => {
  if (currentBid < 200000) {
    return currentBid + settings.bidIncrement1;
  } else if (currentBid < 500000) {
    return currentBid + settings.bidIncrement2;
  } else {
    return currentBid + settings.bidIncrement3;
  }
};