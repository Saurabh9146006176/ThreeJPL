import React, { useState } from 'react';
import { Player, PlayerRole, ExperienceLevel, AuctionSettings, ConfirmAction } from '../types';
import { Plus, Search, Trash2, Upload, User, UserPlus, Edit3, X, Save, CopyX } from 'lucide-react';

interface PlayersPageProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  settings: AuctionSettings;
  onAddPlayer: (player: Player) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (id: string) => void;
  confirmAction: ConfirmAction;
}

const INITIAL_PLAYER_FORM = {
  id: '',
  name: '',
  mobileNumber: '',
  category: 'Right Handed Batsman' as PlayerRole,
  experience: 'Intermediate' as ExperienceLevel,
  basePrice: 0,
  photoUrl: '',
  isSold: false,
  soldToTeamId: undefined as string | undefined,
  soldPrice: undefined as number | undefined
};

export const PlayersPage: React.FC<PlayersPageProps> = ({ players, setPlayers, settings, onAddPlayer, onUpdatePlayer, onDeletePlayer, confirmAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState(INITIAL_PLAYER_FORM);

  const handleOpenForm = () => {
    setFormData({ ...INITIAL_PLAYER_FORM, basePrice: settings.defaultBasePrice });
    setIsEditing(false);
    setShowForm(true);
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.mobileNumber.includes(searchTerm)
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { 
        alert("File too large. Max 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveDuplicates = () => {
    const uniqueMap = new Map();
    let duplicateCount = 0;
    
    // Logic: Key is Name + Mobile. If key exists, it's a duplicate.
    const uniquePlayers = players.filter(p => {
        const key = `${p.name.trim().toLowerCase()}-${p.mobileNumber.trim()}`;
        if (uniqueMap.has(key)) {
            duplicateCount++;
            return false;
        }
        uniqueMap.set(key, true);
        return true;
    });

    if (duplicateCount > 0) {
        confirmAction(
            'Remove Duplicates?',
            `Found ${duplicateCount} duplicate players (matching Name & Mobile). This will remove the duplicates and keep the first occurrence.`,
            () => setPlayers(uniquePlayers)
        );
    } else {
        alert("No duplicates found.");
    }
  };

  const handleEdit = (player: Player) => {
    setFormData({
      id: player.id,
      name: player.name,
      mobileNumber: player.mobileNumber,
      category: player.category,
      experience: player.experience,
      basePrice: player.basePrice,
      photoUrl: player.photoUrl || '',
      isSold: player.isSold,
      soldToTeamId: player.soldToTeamId,
      soldPrice: player.soldPrice
    });
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobileNumber) return;
    
    if (isEditing) {
      const updatedPlayer: Player = {
        ...formData,
        id: formData.id // Ensure ID persists
      };
      onUpdatePlayer(updatedPlayer);
    } else {
      const player: Player = {
        id: `p${Date.now()}`,
        name: formData.name,
        mobileNumber: formData.mobileNumber,
        category: formData.category,
        experience: formData.experience,
        photoUrl: formData.photoUrl,
        basePrice: Number(formData.basePrice),
        isSold: false
      };
      onAddPlayer(player);
    }

    setShowForm(false);
    setIsEditing(false);
    setFormData(INITIAL_PLAYER_FORM);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight">Player Pool</h2>
           <p className="text-slate-400 mt-1">Manage auction participants</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 group">
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all"
            />
            <Search className="absolute left-3 top-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
          </div>
          <button 
             onClick={handleRemoveDuplicates}
             className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl hover:bg-slate-700 hover:text-white border border-slate-700 transition-all"
             title="Remove Duplicates"
          >
             <CopyX size={18} />
          </button>
          <button
            onClick={() => {
              if(showForm) {
                setShowForm(false);
                setIsEditing(false);
              } else {
                handleOpenForm();
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-500 flex items-center whitespace-nowrap shadow-lg shadow-blue-900/20 font-medium transition-all"
          >
            {showForm ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />} 
            {showForm ? 'Cancel' : 'Add Player'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-white/10 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center">
             {isEditing ? <Edit3 className="mr-2 text-cyan-400" size={20} /> : <UserPlus className="mr-2 text-blue-400" size={20} />}
             {isEditing ? 'Update Player Details' : 'Register New Player'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Photo */}
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
              {formData.photoUrl ? (
                <div className="relative w-32 h-32 mb-4">
                  <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover rounded-full shadow-lg border-2 border-slate-600" />
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({...prev, photoUrl: ''}))}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 mb-4 bg-slate-800 rounded-full flex items-center justify-center text-slate-600">
                  <User size={48} />
                </div>
              )}
              <label className="cursor-pointer bg-slate-800 border border-slate-600 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 hover:text-white transition-colors flex items-center shadow-sm text-sm font-medium">
                <Upload size={16} className="mr-2" />
                Upload Photo
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wide">Max Size: 10MB</p>
            </div>

            {/* Right Column: Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-600"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mobile Number *</label>
                <input
                  required
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-600"
                  placeholder="Enter mobile number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role *</label>
                    <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as PlayerRole })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-white appearance-none"
                    >
                    <option value="Right Handed Batsman">Right Handed Batsman</option>
                    <option value="Left Handed Batsman">Left Handed Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All Rounder">All Rounder</option>
                    <option value="Wicket Keeper">Wicket Keeper</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Experience *</label>
                    <select
                    value={formData.experience}
                    onChange={e => setFormData({ ...formData, experience: e.target.value as ExperienceLevel })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-white appearance-none"
                    >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advance">Advance</option>
                    </select>
                </div>
              </div>

               <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Base Price (₹)</label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-white font-mono"
                />
              </div>
              
              {isEditing && formData.isSold && (
                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs text-slate-400">
                  <span className="font-bold text-yellow-500">Note:</span> This player is marked as SOLD. Editing basic details is allowed, but to change sold price or team, please use the Undo feature in the Auction page to avoid accounting errors.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
            <button type="button" onClick={() => { setShowForm(false); setIsEditing(false); }} className="px-5 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-500 hover:to-indigo-500 font-medium shadow-lg flex items-center">
              <Save size={18} className="mr-2" />
              {isEditing ? 'Update Player' : 'Save Player'}
            </button>
          </div>
        </form>
      )}

      {/* Players List */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-xl">
        {filteredPlayers.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center">
             <User size={48} className="mb-4 opacity-20" />
            <p>No players found in database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Player</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Value</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-transparent">
              {filteredPlayers.map(player => (
                <tr key={player.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {player.photoUrl ? (
                          <img className="h-10 w-10 rounded-full object-cover border border-slate-600" src={player.photoUrl} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                            <User size={20} />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">{player.name}</div>
                        <div className="text-xs text-slate-500">{player.mobileNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded bg-slate-800 text-blue-300 border border-blue-500/20">
                      {player.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {player.experience}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {player.isSold ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wider">
                        Sold
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                        Unsold
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-slate-300">
                    {player.soldPrice ? <span className="text-green-400">₹{player.soldPrice.toLocaleString()}</span> : <span className="opacity-50">-</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(player)}
                        className="text-slate-600 hover:text-blue-400 p-2 rounded hover:bg-blue-500/10 transition-all"
                        title="Edit Player"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => { confirmAction('Delete Player?', `Are you sure you want to delete ${player.name}?`, () => onDeletePlayer(player.id)); }}
                        className="text-slate-600 hover:text-red-400 p-2 rounded hover:bg-red-500/10 transition-all"
                        title="Delete Player"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};