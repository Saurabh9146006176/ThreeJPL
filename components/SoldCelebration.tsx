import React, { useState, useEffect, useRef } from 'react';
import { Users, ArrowRight } from 'lucide-react';
import { Player, Team } from '../types';

interface SoldCelebrationProps {
  player: Player;
  team: Team;
  price: number;
  onNext: () => void;
  nextPlayer?: Player | null;
}

/* =========================
   CONFETTI
========================= */
const Confetti3D: React.FC = () => {
  const pieces = 22;
  const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ec4899'];

  return (
    <div className="fixed inset-0 pointer-events-none z-[250] overflow-hidden">
      {Array.from({ length: pieces }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 3;
        const duration = 6 + Math.random() * 4;
        const size = 18 + Math.random() * 36;
        const color = colors[Math.floor(Math.random() * colors.length)];

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: '-60px',
              width: `${size}px`,
              height: `${size / 4}px`,
              borderRadius: '999px',
              background: color,
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `confettiFloat ${duration}s ease-in-out ${delay}s infinite`,
              opacity: 0.9,
            }}
          />
        );
      })}

      <style>{`
        @keyframes confettiFloat {
          0% { transform: translateY(-10vh) rotate(0deg); }
          100% { transform: translateY(110vh) rotate(720deg); }
        }

        @keyframes sparkleGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(255,215,0,0.6); }
          50% { box-shadow: 0 0 90px rgba(255,215,0,1); }
        }
      `}</style>
    </div>
  );
};

export const SoldCelebration: React.FC<SoldCelebrationProps> = ({
  player,
  team,
  price,
  onNext,
}) => {
  const [stage, setStage] = useState<'hammer' | 'celebration'>('hammer');

  /* SINGLE AUDIO INSTANCE (IMPORTANT) */
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/applause.mp3');
    audio.volume = 0.7;
    audio.preload = 'auto';
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  /* CHANGE TO CELEBRATION */
  useEffect(() => {
    const timer = setTimeout(() => setStage('celebration'), 3500);
    return () => clearTimeout(timer);
  }, []);

  /* PLAY SOUND SAFELY */
  useEffect(() => {
    if (stage === 'celebration' && audioRef.current) {
      const audio = audioRef.current;

      audio.currentTime = 0;

      audio.play().catch(err => {
        console.log('Audio playback blocked:', err);
      });
    }
  }, [stage]);

  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">

      {stage === 'celebration' && <Confetti3D />}

      <div className="text-center relative px-6 z-10 max-w-6xl w-full">

        {stage === 'hammer' && (
          <video autoPlay muted playsInline className="w-96 h-96 object-contain mx-auto">
            <source src="/ham.webm" type="video/webm" />
          </video>
        )}

        {stage === 'celebration' && (
          <div className="relative flex flex-col items-center">

            <div className="flex items-center justify-center gap-28">

              {/* TEAM */}
              <div className="text-right">
                <p className="text-sm text-white/60 uppercase tracking-widest mb-4">
                  Sold To
                </p>

                {team.logoUrl && (
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    className="w-80 h-80 object-contain ml-auto"
                  />
                )}

                <p className="text-2xl font-black text-cyan-400 mt-3">
                  {team.name}
                </p>
              </div>

              {/* PLAYER */}
              <div className="relative flex items-center justify-center">
                <div
                  className="rounded-3xl overflow-hidden relative w-[28rem] h-[28rem] bg-black flex items-center justify-center"
                  style={{
                    border: '6px solid rgba(255,215,0,0.6)',
                    animation: 'sparkleGlow 2.2s ease-in-out infinite'
                  }}
                >
                  {player.photoUrl ? (
                    <img
                      src={player.photoUrl}
                      className="max-w-full max-h-full object-contain"
                      alt={player.name}
                    />
                  ) : (
                    <Users size={160} className="text-slate-600" />
                  )}

                  <div className="absolute top-4 right-4 rotate-[-18deg]">
                    <span className="text-5xl font-black text-red-600">
                      SOLD
                    </span>
                  </div>
                </div>

                <p className="text-3xl font-black text-white mt-5">
                  {player.name}
                </p>
              </div>

              {/* PRICE */}
              <div className="text-left">
                <p className="text-sm text-white/60 uppercase tracking-widest">
                  Final Bid
                </p>
                <p className="text-5xl font-black text-yellow-300 mt-2">
                  {formatCurrency(price)}
                </p>
              </div>

            </div>

            <button
              onClick={onNext}
              className="absolute bottom-6 right-6 px-5 py-2 bg-cyan-600 text-white text-sm font-bold rounded-full flex items-center gap-2 hover:scale-105 transition-all"
            >
              Next
              <ArrowRight size={16} />
            </button>

          </div>
        )}
      </div>
    </div>
  );
};
