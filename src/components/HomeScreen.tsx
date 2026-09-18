import React from 'react';
import { Play, Grid, HelpCircle, Settings as SettingsIcon, Star, Trophy, ArrowUp, ArrowRight, ArrowDown, ArrowLeft } from 'lucide-react';
import { GameProgress } from '../types';
import { soundEngine } from '../utils/audio';

interface HomeScreenProps {
  progress: GameProgress;
  onPlay: () => void;
  onOpenLevelSelect: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  progress,
  onPlay,
  onOpenLevelSelect,
  onOpenHowToPlay,
  onOpenSettings,
}) => {
  const totalStars = Object.values(progress.completedLevels).reduce((acc, r) => acc + r.stars, 0);
  const completedCount = Object.keys(progress.completedLevels).length;

  return (
    <div
      id="home-screen"
      className="flex flex-col h-full w-full max-w-md mx-auto bg-slate-50 border-x border-slate-200/60 shadow-lg relative overflow-hidden select-none"
    >
      {/* Top Header */}
      <header className="p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/60 rounded-full text-amber-700 font-semibold text-xs shadow-2xs">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
          <span>{totalStars} Stars</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="home-help-button"
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenHowToPlay();
            }}
            className="p-2.5 rounded-2xl bg-white border border-slate-200/70 text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all shadow-2xs"
            title="How to Play"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            id="home-settings-button"
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenSettings();
            }}
            className="p-2.5 rounded-2xl bg-white border border-slate-200/70 text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all shadow-2xs"
            title="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Hero Visual Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* Animated Brand Emblem with 4 Directional Arrows */}
        <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
          {/* Subtle Outer Card */}
          <div className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-slate-200/80 transform rotate-3" />
          <div className="relative z-10 grid grid-cols-2 gap-2 p-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform hover:-translate-y-1">
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center transition-transform hover:translate-x-1">
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center transition-transform hover:-translate-x-1">
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform hover:translate-y-1">
              <ArrowDown className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Game Title */}
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          ARROW <span className="text-blue-600">ESCAPE</span>
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1 max-w-xs leading-relaxed">
          Untangle the arrows and clear every board across 50 progressive levels.
        </p>

        {/* Progress Pill */}
        <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
          <Trophy className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-700">
            Level {progress.highestUnlocked} of 50 • {completedCount} Cleared
          </span>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="p-6 bg-white border-t border-slate-100 flex flex-col gap-3 shrink-0">
        <button
          id="home-play-button"
          onClick={() => {
            soundEngine.playButtonClick();
            onPlay();
          }}
          className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/25 transition-all"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{completedCount === 0 ? 'START PLAYING' : `CONTINUE LEVEL ${progress.highestUnlocked}`}</span>
        </button>

        <button
          id="home-level-select-button"
          onClick={() => {
            soundEngine.playButtonClick();
            onOpenLevelSelect();
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
        >
          <Grid className="w-4 h-4 text-slate-600" />
          <span>ALL 50 LEVELS</span>
        </button>
      </div>
    </div>
  );
};
