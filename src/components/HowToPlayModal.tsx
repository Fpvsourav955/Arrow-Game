import React from 'react';
import { X, CheckCircle2, XCircle, Heart, Star, Sparkles } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="how-to-play-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">How to Play</h2>
          </div>
          <button
            id="close-how-to-play"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 my-4">
          {/* Rule 1: Free Arrow */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">1. Tap Free Arrows</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Arrows fly outward in the direction they point. If there are no other arrows in front of it, it will fly off the board safely!
              </p>
            </div>
          </div>

          {/* Rule 2: Blocked Arrow */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="p-2 bg-red-100 text-red-500 rounded-xl shrink-0 mt-0.5">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">2. Avoid Blocked Paths</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                If another arrow is sitting in its exit path, the arrow cannot move. Tapping a blocked arrow costs you 1 heart!
              </p>
            </div>
          </div>

          {/* Rule 3: 3 Hearts */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="p-2 bg-rose-100 text-rose-500 rounded-xl shrink-0 mt-0.5">
              <Heart className="w-5 h-5" fill="currentColor" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">3. 3 Hearts per Level</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You begin each level with 3 hearts. If you lose all 3 hearts, you'll need to restart the level.
              </p>
            </div>
          </div>

          {/* Rule 4: Stars & Planning */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-500 rounded-xl shrink-0 mt-0.5">
              <Star className="w-5 h-5" fill="currentColor" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">4. Earn 3 Stars</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Finish with 3 hearts remaining for a 3-star rating! Use the <span className="font-semibold text-blue-600">Hint</span> button whenever you get stuck.
              </p>
            </div>
          </div>
        </div>

        <button
          id="got-it-button"
          onClick={onClose}
          className="w-full py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all"
        >
          Got It, Let's Play!
        </button>
      </div>
    </div>
  );
};
