import React, { useState, useRef } from 'react';
import { Team, Player, AuctionSettings, ConfirmAction } from '../types';
import { Plus, Trash2, X, Upload, User, Shield, Edit3, Star, Search, Printer, FileText, Info, Download, RefreshCw } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface TeamsPageProps {
  teams: Team[];
  players: Player[];
  setPlayers: (players: Player[]) => void;
  settings: AuctionSettings;
  onUpdateTeam: (team: Team) => void;
  onAddTeam: (team: Team) => void;
  onDeleteTeam: (id: string) => void;
  confirmAction: ConfirmAction;
  onReload: () => Promise<void>;
}

const INITIAL_TEAM_FORM = {
  id: '',
  name: '',
  logoUrl: '',
  
  captainName: '',
  captainMobile: '',
  captainPhotoUrl: '',
  
  viceCaptainName: '',
  viceCaptainMobile: '',
  viceCaptainPhotoUrl: '',

  playersBought: [] as string[],
  purseRemaining: 0
};

export const TeamsPage: React.FC<TeamsPageProps> = ({ teams, players, setPlayers, settings, onUpdateTeam, onAddTeam, onDeleteTeam, confirmAction, onReload }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(INITIAL_TEAM_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Team Info Modal State
  const [showTeamInfo, setShowTeamInfo] = useState(false);
  const [selectedTeamForInfo, setSelectedTeamForInfo] = useState<Team | null>(null);

  // Search States
  const [capSearchTerm, setCapSearchTerm] = useState('');
  const [vcSearchTerm, setVcSearchTerm] = useState('');
  const [showCapResults, setShowCapResults] = useState(false);
  const [showVcResults, setShowVcResults] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = 'https://us-central1-axilam.cloudfunctions.net/api';

  async function uploadImageFile(file: File, folder = 'team_assets'): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);

    const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Upload failed ${res.status}: ${body}`);
    }
    const json = await res.json();
    return json.url;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'captainPhotoUrl' | 'viceCaptainPhotoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { 
      alert("File too large. Max 5MB.");
      return;
    }

    try {
      const url = await uploadImageFile(file, field === 'logoUrl' ? 'team_logo' : 'team_assets');
      setFormData(prev => ({ ...prev, [field]: url }));
    } catch (err) {
      // fallback to local preview
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      reader.readAsDataURL(file);
      console.error('Upload failed, using local preview:', err);
      alert('Logo upload failed — using local preview. Check function deployment.');
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onReload();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEdit = (team: Team) => {
    setFormData({
      id: team.id,
      name: team.name,
      logoUrl: team.logoUrl || '',
      
      captainName: team.captainName,
      captainMobile: team.captainMobile || '',
      captainPhotoUrl: team.captainPhotoUrl || '',

      viceCaptainName: team.viceCaptainName || '',
      viceCaptainMobile: team.viceCaptainMobile || '',
      viceCaptainPhotoUrl: team.viceCaptainPhotoUrl || '',

      playersBought: team.playersBought,
      purseRemaining: team.purseRemaining
    });
    setCapSearchTerm('');
    setVcSearchTerm('');
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPlayer = (playerId: string, role: 'CAPTAIN' | 'VICE') => {
    const selectedPlayer = players.find(p => p.id === playerId);
    if (!selectedPlayer) return;

    if (role === 'CAPTAIN') {
        setFormData(prev => ({
            ...prev,
            captainName: selectedPlayer.name,
            captainMobile: selectedPlayer.mobileNumber,
            captainPhotoUrl: selectedPlayer.photoUrl || ''
        }));
        setCapSearchTerm('');
        setShowCapResults(false);
    } else {
        setFormData(prev => ({
            ...prev,
            viceCaptainName: selectedPlayer.name,
            viceCaptainMobile: selectedPlayer.mobileNumber,
            viceCaptainPhotoUrl: selectedPlayer.photoUrl || ''
        }));
        setVcSearchTerm('');
        setShowVcResults(false);
    }
  };

  const syncFixedPlayers = (teamId: string, data: typeof formData) => {
    const captainId = `${teamId}_cap`;
    const viceCaptainId = `${teamId}_vc`;

    // Try to find the original players in the list to preserve their roles
    const originalCaptain = players.find(p => p.name === data.captainName && p.mobileNumber === data.captainMobile);
    const originalVice = players.find(p => p.name === data.viceCaptainName && p.mobileNumber === data.viceCaptainMobile);

    const captainPlayer: Player = {
      id: captainId,
      name: data.captainName,
      mobileNumber: data.captainMobile || 'N/A',
      category: originalCaptain ? originalCaptain.category : 'All Rounder', // Preserved Role
      experience: originalCaptain ? originalCaptain.experience : 'Advance',
      photoUrl: data.captainPhotoUrl,
      basePrice: 0,
      isSold: true,
      soldToTeamId: teamId,
      soldPrice: 0
    };

    const viceCaptainPlayer: Player = {
      id: viceCaptainId,
      name: data.viceCaptainName || 'Vice Captain',
      mobileNumber: data.viceCaptainMobile || 'N/A',
      category: originalVice ? originalVice.category : 'All Rounder', // Preserved Role
      experience: originalVice ? originalVice.experience : 'Advance',
      photoUrl: data.viceCaptainPhotoUrl,
      basePrice: 0,
      isSold: true,
      soldToTeamId: teamId,
      soldPrice: 0
    };

    // Remove old captain/vc entries for this team, then add new ones
    // Also remove the "original" entries if they existed as unsold players to avoid duplicates in the pool
    const otherPlayers = players.filter(p => 
      p.id !== captainId && 
      p.id !== viceCaptainId && 
      p.name !== data.captainName && // Remove original if exists
      p.name !== data.viceCaptainName // Remove original if exists
    );
    
    // Mark all players in playersBought as sold to this team
    const updatedPlayers = otherPlayers.map(p => {
      if (data.playersBought.includes(p.id)) {
        return {
          ...p,
          isSold: true,
          soldToTeamId: teamId,
          soldPrice: p.soldPrice || 0
        };
      }
      return p;
    });
    
    setPlayers([...updatedPlayers, captainPlayer, viceCaptainPlayer]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.captainName.trim()) return;

    let teamId = formData.id;
    if (!isEditing) {
      teamId = `t${Date.now()}`;
    }

    const teamData: Team = {
      id: teamId,
      name: formData.name,
      logoUrl: formData.logoUrl,
      logoColor: 'bg-indigo-500',
      purseRemaining: isEditing ? formData.purseRemaining : settings.totalPurse,
      playersBought: formData.playersBought,
      
      captainName: formData.captainName,
      captainMobile: formData.captainMobile,
      captainPhotoUrl: formData.captainPhotoUrl,

      viceCaptainName: formData.viceCaptainName,
      viceCaptainMobile: formData.viceCaptainMobile,
      viceCaptainPhotoUrl: formData.viceCaptainPhotoUrl
    };

    if (isEditing) {
      onUpdateTeam(teamData);
    } else {
      onAddTeam(teamData);
    }

    syncFixedPlayers(teamId, { ...formData, id: teamId });

    setFormData(INITIAL_TEAM_FORM);
    setShowForm(false);
    setIsEditing(false);
  };

  const handleDeleteWithPlayers = (teamId: string) => {
    onDeleteTeam(teamId);
    const captainId = `${teamId}_cap`;
    const viceCaptainId = `${teamId}_vc`;
    setPlayers(players.filter(p => p.id !== captainId && p.id !== viceCaptainId));
  };

  const getTeamPlayers = (team: Team) => {
    return players.filter(p => team.playersBought.includes(p.id));
  };

  const handleImportTeams = () => {
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
        
        let importedTeams: Team[] = [];
        
        if (Array.isArray(rawData)) {
          // It's an array of teams
          importedTeams = rawData.map((t: any, index: number) => ({
            id: t.id ? String(t.id) : `t_imp_${Date.now()}_${index}`,
            name: t.name || `Team ${index + 1}`,
            logoUrl: t.logoUrl || '',
            logoColor: t.logoColor || 'bg-indigo-500',
            captainName: t.captainName || 'TBD',
            captainMobile: t.captainMobile || '',
            captainPhotoUrl: t.captainPhotoUrl || '',
            viceCaptainName: t.viceCaptainName || '',
            viceCaptainMobile: t.viceCaptainMobile || '',
            viceCaptainPhotoUrl: t.viceCaptainPhotoUrl || '',
            playersBought: Array.isArray(t.playersBought) ? t.playersBought : [],
            purseRemaining: t.purseRemaining || settings.totalPurse
          }));
        } else if (rawData.teams && Array.isArray(rawData.teams)) {
          // It's a full backup, extract teams
          importedTeams = rawData.teams.map((t: any, index: number) => ({
            id: t.id ? String(t.id) : `t_imp_${Date.now()}_${index}`,
            name: t.name || `Team ${index + 1}`,
            logoUrl: t.logoUrl || '',
            logoColor: t.logoColor || 'bg-indigo-500',
            captainName: t.captainName || 'TBD',
            captainMobile: t.captainMobile || '',
            captainPhotoUrl: t.captainPhotoUrl || '',
            viceCaptainName: t.viceCaptainName || '',
            viceCaptainMobile: t.viceCaptainMobile || '',
            viceCaptainPhotoUrl: t.viceCaptainPhotoUrl || '',
            playersBought: Array.isArray(t.playersBought) ? t.playersBought : [],
            purseRemaining: t.purseRemaining || settings.totalPurse
          }));
        }
        
        if (importedTeams.length > 0) {
          confirmAction(
            'Import Teams?',
            `Found ${importedTeams.length} teams in the file.\n\nThis will APPEND them to your existing teams.`,
            () => {
              importedTeams.forEach(team => {
                onAddTeam(team);
                // Sync players for each imported team
                syncFixedPlayers(team.id, {
                  id: team.id,
                  name: team.name,
                  logoUrl: team.logoUrl || '',
                  captainName: team.captainName,
                  captainMobile: team.captainMobile || '',
                  captainPhotoUrl: team.captainPhotoUrl || '',
                  viceCaptainName: team.viceCaptainName || '',
                  viceCaptainMobile: team.viceCaptainMobile || '',
                  viceCaptainPhotoUrl: team.viceCaptainPhotoUrl || '',
                  playersBought: team.playersBought,
                  purseRemaining: team.purseRemaining
                });
              });
              alert(`${importedTeams.length} teams imported successfully!`);
            }
          );
        } else {
          alert("No valid teams found in the JSON file.");
        }
        
      } catch (err) {
        console.error(err);
        alert("Failed to parse JSON file. Please ensure it is a valid JSON with team data.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- PDF GENERATION LOGIC ---
  const generateTeamPDF = (team: Team) => {
    const teamPlayers = getTeamPlayers(team);
    const date = new Date().toLocaleDateString();

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print.");
        return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Team Roster - ${team.name}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
          .team-logo { width: 80px; height: 80px; margin: 0 auto 15px; object-fit: contain; }
          .team-name { font-size: 28px; font-weight: bold; text-transform: uppercase; }
          .meta { font-size: 14px; margin-top: 5px; color: #666; }
          .stats-box { display: flex; justify-content: space-between; margin-bottom: 20px; background: #f4f4f4; padding: 15px; border-radius: 8px; }
          .stat { text-align: center; }
          .stat-label { font-size: 12px; text-transform: uppercase; font-weight: bold; color: #555; }
          .stat-val { font-size: 18px; font-weight: bold; }
          table { w-100%; width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { text-align: left; background: #333; color: #fff; padding: 10px; font-size: 12px; text-transform: uppercase; }
          td { border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px; }
          tr:nth-child(even) { background: #f9f9f9; }
          .role-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #eee; border: 1px solid #ccc; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
          .price { font-family: monospace; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          ${team.logoUrl ? `<img src="${team.logoUrl}" alt="${team.name}" class="team-logo" />` : ''}
          <div class="team-name">${team.name}</div>
          <div class="meta">Auction Report • ${date}</div>
        </div>

        <div class="stats-box">
          <div class="stat">
            <div class="stat-label">Purse Remaining</div>
            <div class="stat-val">₹${team.purseRemaining.toLocaleString()}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Total Players</div>
            <div class="stat-val">${teamPlayers.length + 2}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Captain</div>
            <div class="stat-val">${team.captainName}</div>
          </div>
        </div>

        <h3>Leadership Core</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Mobile</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${team.captainName}</strong></td>
              <td>Captain</td>
              <td>Fixed</td>
              <td>${team.captainMobile || 'N/A'}</td>
            </tr>
            ${team.viceCaptainName ? `
            <tr>
              <td><strong>${team.viceCaptainName}</strong></td>
              <td>Key Player</td>
              <td>Fixed</td>
              <td>${team.viceCaptainMobile || 'N/A'}</td>
            </tr>` : ''}
          </tbody>
        </table>

        <h3>Auction Acquisitions</h3>
        ${teamPlayers.length === 0 ? '<p style="text-align:center; padding: 20px; color: #666;">No players bought yet.</p>' : `
        <table>
          <thead>
            <tr>
              <th>Player Name</th>
              <th>Mobile</th>
              <th>Category</th>
              <th style="text-align:right;">Sold Price</th>
            </tr>
          </thead>
          <tbody>
            ${teamPlayers.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${p.mobileNumber}</td>
                <td><span class="role-badge">${p.category}</span></td>
                <td style="text-align:right;" class="price">₹${p.soldPrice?.toLocaleString() || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        `}

        <div class="footer">
          Generated by Premier League Auctioneer System
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // --- DOWNLOAD PDF FUNCTION ---
  const downloadTeamPDF = async (team: Team) => {
    const teamPlayers = getTeamPlayers(team);
    const date = new Date().toLocaleDateString();

    // Center content and fix width for PDF
    const htmlContent = `
      <div id="pdf-content" style="font-family: Arial, sans-serif; padding: 20px; color: #333; width: 700px; margin: 0 auto; background: #fff;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
          ${team.logoUrl ? `<img src="${team.logoUrl}" alt="${team.name}" style="width: 80px; height: 80px; margin: 0 auto 15px; object-fit: contain; display: block;" crossorigin="anonymous" />` : ''}
          <div style="font-size: 28px; font-weight: bold; text-transform: uppercase;">${team.name}</div>
          <div style="font-size: 14px; margin-top: 5px; color: #666;">Auction Report • ${date}</div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; background: #f4f4f4; padding: 15px; border-radius: 8px;">
          <div style="text-align: center;">
            <div style="font-size: 12px; text-transform: uppercase; font-weight: bold; color: #555;">Purse Remaining</div>
            <div style="font-size: 18px; font-weight: bold;">₹${team.purseRemaining.toLocaleString()}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 12px; text-transform: uppercase; font-weight: bold; color: #555;">Total Players</div>
            <div style="font-size: 18px; font-weight: bold;">${teamPlayers.length + 2}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 12px; text-transform: uppercase; font-weight: bold; color: #555;">Captain</div>
            <div style="font-size: 18px; font-weight: bold;">${team.captainName}</div>
          </div>
        </div>

        <h3>Leadership Core</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr>
              <th style="text-align: left; background: #333; color: #fff; padding: 10px; font-size: 12px; text-transform: uppercase;">Name</th>
              <th style="text-align: left; background: #333; color: #fff; padding: 10px; font-size: 12px; text-transform: uppercase;">Role</th>
              <th style="text-align: left; background: #333; color: #fff; padding: 10px; font-size: 12px; text-transform: uppercase;">Status</th>
              <th style="text-align: left; background: #333; color: #fff; padding: 10px; font-size: 12px; text-transform: uppercase;">Mobile</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #f9f9f9;">
              <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px;"><strong>${team.captainName}</strong></td>
              <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px;">Captain</td>
              <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px;">Fixed</td>
              <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px;">${team.captainMobile || 'N/A'}</td>
            </tr>
            ${team.viceCaptainName ? `
            <tr>
              <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px;"><strong>${team.viceCaptainName}</strong></td>
              <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px;">Key Player</td>
              <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px;">Fixed</td>
              <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px;">${team.viceCaptainMobile || 'N/A'}</td>
            </tr>` : ''}
          </tbody>
        </table>

        <h3 style="margin-top: 30px;">Auction Acquisitions</h3>
        ${teamPlayers.length === 0 ? '<p style="text-align:center; padding: 20px; color: #666;">No players bought yet.</p>' : `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr>
              <th style="text-align: left; background: #333; color: #fff; padding: 10px; font-size: 12px; text-transform: uppercase;">Player Name</th>
              <th style="text-align: left; background: #333; color: #fff; padding: 10px; font-size: 12px; text-transform: uppercase;">Mobile</th>
              <th style="text-align: left; background: #333; color: #fff; padding: 10px; font-size: 12px; text-transform: uppercase; min-width: 120px; max-width: 160px; vertical-align: middle; word-break: break-all;">Category</th>
              <th style="text-align: right; background: #333; color: #fff; padding: 10px; font-size: 12px; text-transform: uppercase;">Sold Price</th>
            </tr>
          </thead>
          <tbody>
            ${teamPlayers.map((p, idx) => `
              <tr style="${idx % 2 === 1 ? 'background: #f9f9f9;' : ''}">
                <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px;">${p.name}</td>
                <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px;">${p.mobileNumber}</td>
                <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px; min-width: 120px; max-width: 160px; vertical-align: middle; word-break: break-all;">
                  <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #eee; border: 1px solid #ccc; display: inline-block; margin-right: 4px; max-width: 140px; word-break: break-all; white-space: normal; vertical-align: middle;">${p.category}</span>
                </td>
                <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 14px; text-align: right; font-family: monospace; font-weight: bold;">₹${p.soldPrice?.toLocaleString() || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        `}

        <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
          Generated by Premier League Auctioneer System
        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);

    // Wait for images to load (logo especially)
    const images = element.getElementsByTagName('img');
    if (images.length > 0) {
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(true);
          } else {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
          }
        });
      });
      await Promise.all(imagePromises);
    }

    // Small delay to ensure rendering
    await new Promise(resolve => setTimeout(resolve, 150));

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number], // top, right, bottom, left
      filename: `${team.name.replace(/[^a-z0-9]/gi, '_')}_Roster.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#fff'
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      document.body.removeChild(element);
    }).catch((err) => {
      console.error('PDF generation error:', err);
      document.body.removeChild(element);
      alert('Error generating PDF. Please try again.');
    });
  };


  // Filter available players for selection (exclude already sold ones)
  const availablePlayers = players
    .filter(p => !p.isSold) // Only show unsold players
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Filter Logic: Exclude current Captain from VC search, and current VC from Captain search
  const filteredCapResults = capSearchTerm 
    ? availablePlayers.filter(p => 
        p.name.toLowerCase().includes(capSearchTerm.toLowerCase()) && 
        p.name !== formData.viceCaptainName // Exclude selected VC
      )
    : [];
    
  const filteredVcResults = vcSearchTerm 
    ? availablePlayers.filter(p => 
        p.name.toLowerCase().includes(vcSearchTerm.toLowerCase()) && 
        p.name !== formData.captainName // Exclude selected Captain
      )
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Team Management</h2>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Configure franchises and view squads</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-none bg-slate-700 text-slate-300 px-3 md:px-4 py-2.5 rounded-xl hover:bg-slate-600 hover:text-white flex items-center justify-center border border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleImportTeams}
            className="flex-1 md:flex-none bg-green-600 text-white px-4 md:px-5 py-2.5 rounded-xl hover:bg-green-500 flex items-center justify-center shadow-lg shadow-green-900/20 transition-all font-medium text-sm"
          >
            <Upload size={18} className="mr-2" /> 
            Import Teams
          </button>
          <button
            onClick={() => {
              setFormData(INITIAL_TEAM_FORM);
              setIsEditing(false);
              setShowForm(!showForm);
            }}
            className="flex-1 md:flex-none bg-cyan-600 text-white px-4 md:px-5 py-2.5 rounded-xl hover:bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-900/20 transition-all font-medium text-sm"
          >
            {showForm ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />} 
            {showForm ? 'Cancel' : 'Add Team'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-white/10 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center">
            <Shield className="mr-2 text-cyan-400" size={20} /> 
            {isEditing ? 'Update Franchise Details' : 'New Franchise'}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Column 1: Team Details */}
            <div className="space-y-5">
              <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-widest border-b border-cyan-500/20 pb-2">Franchise Info</h4>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Team Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white placeholder-slate-600"
                  placeholder="e.g. Cyber Punks"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-800 rounded-xl flex items-center justify-center border border-dashed border-slate-600 overflow-hidden">
                  {formData.logoUrl ? <img src={formData.logoUrl} className="w-full h-full object-cover" /> : <Shield className="text-slate-600" />}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Logo</label>
                  <label className="cursor-pointer bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 text-xs inline-flex items-center">
                    <Upload size={12} className="mr-2" /> Upload
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
                  </label>
                </div>
              </div>
            </div>

            {/* Column 2: Captain Details */}
            <div className="space-y-5 lg:border-l lg:border-white/5 lg:pl-8">
               <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-widest border-b border-yellow-500/20 pb-2">Captain (Fixed)</h4>
               
               {/* Search Input for Captain */}
               <div className="relative">
                  <label className="block text-[10px] font-bold text-yellow-500 uppercase tracking-wider mb-2">Search & Select</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Type name to search..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                      value={capSearchTerm}
                      onChange={(e) => { setCapSearchTerm(e.target.value); setShowCapResults(true); }}
                    />
                    <Search size={14} className="absolute right-3 top-3 text-slate-500"/>
                  </div>
                  
                  {/* Results Dropdown */}
                  {showCapResults && capSearchTerm && (
                    <div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 rounded-lg mt-1 z-50 max-h-40 overflow-y-auto shadow-xl">
                      {filteredCapResults.length > 0 ? (
                        filteredCapResults.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => handleSelectPlayer(p.id, 'CAPTAIN')}
                            className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm text-slate-200 border-b border-white/5 last:border-0"
                          >
                            <span className="font-bold">{p.name}</span> <span className="text-slate-500 text-xs">({p.category})</span>
                          </div>
                        ))
                      ) : (
                         <div className="px-3 py-2 text-xs text-slate-500">No matches found</div>
                      )}
                    </div>
                  )}
               </div>

               <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Selected Captain *</label>
                <input
                  required
                  readOnly
                  type="text"
                  value={formData.captainName}
                  onChange={(e) => setFormData({ ...formData, captainName: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 outline-none text-slate-300"
                  placeholder="No captain selected"
                />
              </div>
              <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mobile</label>
                    <input
                      type="tel"
                      value={formData.captainMobile}
                      onChange={(e) => setFormData({ ...formData, captainMobile: e.target.value })}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 outline-none text-white"
                    />
                  </div>
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-dashed border-slate-600 overflow-hidden shrink-0 mt-6">
                    {formData.captainPhotoUrl ? <img src={formData.captainPhotoUrl} className="w-full h-full object-cover" /> : <User className="text-slate-600" />}
                  </div>
              </div>
            </div>

            {/* Column 3: Vice Captain Details */}
            <div className="space-y-5 lg:border-l lg:border-white/5 lg:pl-8">
               <h4 className="text-sm font-bold text-purple-400 uppercase tracking-widest border-b border-purple-500/20 pb-2">Key Player (Fixed)</h4>
               
               {/* Search Input for VC */}
               <div className="relative">
                  <label className="block text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-2">Search & Select</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Type name to search..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                      value={vcSearchTerm}
                      onChange={(e) => { setVcSearchTerm(e.target.value); setShowVcResults(true); }}
                    />
                    <Search size={14} className="absolute right-3 top-3 text-slate-500"/>
                  </div>
                  
                  {/* Results Dropdown */}
                  {showVcResults && vcSearchTerm && (
                    <div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 rounded-lg mt-1 z-50 max-h-40 overflow-y-auto shadow-xl">
                      {filteredVcResults.length > 0 ? (
                        filteredVcResults.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => handleSelectPlayer(p.id, 'VICE')}
                            className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm text-slate-200 border-b border-white/5 last:border-0"
                          >
                            <span className="font-bold">{p.name}</span> <span className="text-slate-500 text-xs">({p.category})</span>
                          </div>
                        ))
                      ) : (
                         <div className="px-3 py-2 text-xs text-slate-500">No matches found</div>
                      )}
                    </div>
                  )}
               </div>

               <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Selected Key Player</label>
                <input
                  required
                  readOnly
                  type="text"
                  value={formData.viceCaptainName}
                  onChange={(e) => setFormData({ ...formData, viceCaptainName: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none text-slate-300"
                  placeholder="No player selected"
                />
              </div>
              <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mobile</label>
                    <input
                      type="tel"
                      value={formData.viceCaptainMobile}
                      onChange={(e) => setFormData({ ...formData, viceCaptainMobile: e.target.value })}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none text-white"
                    />
                  </div>
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-dashed border-slate-600 overflow-hidden shrink-0 mt-6">
                    {formData.viceCaptainPhotoUrl ? <img src={formData.viceCaptainPhotoUrl} className="w-full h-full object-cover" /> : <User className="text-slate-600" />}
                  </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 font-medium shadow-lg">
              {isEditing ? 'Update & Sync Players' : 'Create Team & Players'}
            </button>
          </div>
        </form>
      )}

      {/* Teams Grid - 4 per row, non-scrollable for up to 10 teams */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {teams.map(team => {
          const teamPlayers = getTeamPlayers(team);
          const rosterCount = teamPlayers.length + 2;

          return (
            <div key={team.id} className="glass-panel rounded-2xl overflow-hidden group hover:bg-slate-800/60 transition-all duration-300 border border-white/5 hover:border-cyan-500/30 flex flex-col">
              <div className="p-4 md:p-5 flex flex-col h-full">
                {/* Team Logo and Name */}
                <div className="flex flex-col items-center mb-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden mb-3 shadow-lg">
                     {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-cover" /> : <Shield className="text-slate-600 w-8 h-8 md:w-10 md:h-10" />}
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white group-hover:text-cyan-400 transition-colors text-center line-clamp-2">{team.name}</h3>
                </div>

                {/* Action Button */}
                <div className="mt-auto">
                  <button
                    onClick={() => { setSelectedTeamForInfo(team); setShowTeamInfo(true); }}
                    className="w-full text-cyan-400 hover:text-cyan-300 transition-colors p-2 md:p-3 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg flex items-center justify-center gap-2 text-xs md:text-sm font-medium border border-cyan-500/20"
                    title="View Team Info"
                  >
                    <Info size={16} />
                    <span>Team Info</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Team Info Modal */}
      {showTeamInfo && selectedTeamForInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowTeamInfo(false)}>
          <div className="glass-panel rounded-2xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-4 md:p-6 flex justify-between items-start z-10">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden">
                   {selectedTeamForInfo.logoUrl ? <img src={selectedTeamForInfo.logoUrl} className="w-full h-full object-cover" /> : <Shield className="text-slate-600 w-6 h-6 md:w-8 md:h-8" />}
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">{selectedTeamForInfo.name}</h3>
                  <p className="text-xs md:text-sm text-slate-400 mt-1">Complete Team Details</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { handleEdit(selectedTeamForInfo); setShowTeamInfo(false); }}
                  className="text-slate-400 hover:text-blue-400 transition-colors p-2 hover:bg-blue-500/10 rounded-lg border border-slate-700 hover:border-blue-500/30"
                  title="Edit Team"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => { setShowTeamInfo(false); confirmAction('Delete Team?', `Are you sure you want to delete ${selectedTeamForInfo.name}?\nThis will also remove the Captain and Key Player from the player list.`, () => handleDeleteWithPlayers(selectedTeamForInfo.id)); }}
                  className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg border border-slate-700 hover:border-red-500/30"
                  title="Delete Team"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => generateTeamPDF(selectedTeamForInfo)}
                  className="text-slate-400 hover:text-green-400 transition-colors p-2 hover:bg-green-500/10 rounded-lg border border-slate-700 hover:border-green-500/30"
                  title="Print / Save PDF"
                >
                  <Printer size={18} />
                </button>
                <button
                  onClick={() => downloadTeamPDF(selectedTeamForInfo)}
                  className="text-slate-400 hover:text-purple-400 transition-colors p-2 hover:bg-purple-500/10 rounded-lg border border-slate-700 hover:border-purple-500/30"
                  title="Download PDF"
                >
                  <Download size={18} />
                </button>
                <button onClick={() => setShowTeamInfo(false)} className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-green-400 uppercase font-bold tracking-wider mb-1">Purse Remaining</p>
                  <p className="text-2xl font-bold text-white font-mono">₹{selectedTeamForInfo.purseRemaining.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-blue-400 uppercase font-bold tracking-wider mb-1">Squad Size</p>
                  <p className={`text-2xl font-bold ${(getTeamPlayers(selectedTeamForInfo).length + 2) >= settings.maxPlayersPerTeam ? 'text-red-400' : 'text-white'}`}>
                    {getTeamPlayers(selectedTeamForInfo).length + 2} <span className="text-base font-normal text-slate-500">/ {settings.maxPlayersPerTeam}</span>
                  </p>
                </div>
              </div>

              {/* Leadership Core */}
              <div>
                <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-widest mb-3 border-b border-yellow-500/20 pb-2">Leadership Core</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-xl border border-white/5">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden">
                      {selectedTeamForInfo.captainPhotoUrl ? <img src={selectedTeamForInfo.captainPhotoUrl} className="w-full h-full object-cover" /> : <User className="text-slate-600" size={20} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white">{selectedTeamForInfo.captainName}</p>
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30 font-bold">CAPTAIN</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{selectedTeamForInfo.captainMobile || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {selectedTeamForInfo.viceCaptainName && (
                    <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-xl border border-white/5">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden">
                        {selectedTeamForInfo.viceCaptainPhotoUrl ? <img src={selectedTeamForInfo.viceCaptainPhotoUrl} className="w-full h-full object-cover" /> : <User className="text-slate-600" size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white">{selectedTeamForInfo.viceCaptainName}</p>
                          <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold">KEY PLAYER</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{selectedTeamForInfo.viceCaptainMobile || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Auction Acquisitions */}
              <div>
                <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-3 border-b border-cyan-500/20 pb-2">
                  Auction Acquisitions ({getTeamPlayers(selectedTeamForInfo).length})
                </h4>
                {getTeamPlayers(selectedTeamForInfo).length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-8">No auction players yet.</p>
                ) : (
                  <div className="space-y-2">
                    {getTeamPlayers(selectedTeamForInfo).map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-white/5 hover:border-cyan-500/20 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-white">{p.name}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">{p.category}</span>
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">{p.experience}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-cyan-400 font-mono font-bold">₹{p.soldPrice?.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{p.mobileNumber}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};