import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4 text-amber-500">
          <AlertTriangle size={24} />
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        
        <p className="text-slate-300 mb-8 leading-relaxed whitespace-pre-wrap">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onCancel(); }}
            className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 font-bold shadow-lg shadow-blue-900/20"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};