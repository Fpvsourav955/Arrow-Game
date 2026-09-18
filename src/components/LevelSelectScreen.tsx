import React, { useState } from 'react';
import { ChevronLeft, Lock, Star, Play, Sparkles } from 'lucide-react';
import { ALL_LEVELS } from '../data/levels';
import { GameProgress } from '../types';
import { soundEngine } from '../utils/audio';

interface LevelSelectScreenProps {
  progress: GameProgress;
  onSelectLevel: (levelNumber: number) => void;
  onBack: () => void;
}

type DifficultyFilter = 'ALL' | 'Very Easy' | 'Easy' | 'Easy-Medium' | 'Medium' | 'Medium-Hard' | 'Hard';

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({
  progress,
  onSelectLevel,
  onBack,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<DifficultyFilter>('ALL');

  // Calculate total stars earned
  const totalStars = Object.values(progress.completedLevels).reduce(
    (acc, res) => acc + res.stars,
    0
  );
  const maxPossibleStars = ALL_LEVELS.length * 3;

  const filteredLevels = ALL_LEVELS.filter((lvl) => {
    if (selectedFilter === 'ALL') return true;
    return lvl.difficulty === selectedFilter;
  });

  const handleLevelClick = (levelNumber: number) => {
    if (levelNumber <= progress.highestUnlocked) {
      soundEngine.playButtonClick();
      onSelectLevel(levelNumber);
    } else {
      soundEngine.playBlocked();
    }
  };

  return (
    <div
      id="level-select-screen"
      className="flex flex-col h-full w-full max-w-md mx-auto bg-slate-50 border-x border-slate-200/60 shadow-lg"
    >
      {/* Top App Bar */}
      <header className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 shadow-2xs">
        <button
          id="back-to-home-btn"
          onClick={() => {
            soundEngine.playButtonClick();
            onBack();
          }}
          className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-1"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Home</span>
        </button>

        <h1 className="text-base font-bold text-slate-800 tracking-tight">Select Level</h1>

        {/* Total Stars Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/60 rounded-full text-amber-700 font-semibold text-xs shadow-2xs">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
          <span>{totalStars}/{maxPossibleStars}</span>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="px-3 py-2.5 bg-white border-b border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
        {[
          { id: 'ALL', label: 'All (50)' },
          { id: 'Very Easy', label: 'Intro (1-5)' },
          { id: 'Easy', label: 'Easy (6-10)' },
          { id: 'Easy-Medium', label: 'Easy-Med (11-20)' },
          { id: 'Medium', label: 'Medium (21-30)' },
          { id: 'Medium-Hard', label: 'Med-Hard (31-40)' },
          { id: 'Hard', label: 'Hard (41-50)' },
        ].map((tab) => {
          const isSelected = selectedFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playButtonClick();
                setSelectedFilter(tab.id as DifficultyFilter);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Level Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-5 gap-3">
          {filteredLevels.map((lvl) => {
            const isUnlocked = lvl.levelNumber <= progress.highestUnlocked;
            const isCompleted = !!progress.completedLevels[lvl.levelNumber];
            const isCurrent = lvl.levelNumber === progress.highestUnlocked && !isCompleted;
            const stars = progress.completedLevels[lvl.levelNumber]?.stars || 0;

            return (
              <button
                key={lvl.levelNumber}
                id={`level-button-${lvl.levelNumber}`}
                onClick={() => handleLevelClick(lvl.levelNumber)}
                disabled={!isUnlocked}
                className={`aspect-square relative rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105 ring-4 ring-blue-200 active:scale-95'
                    : isCompleted
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs hover:border-blue-400 active:scale-95'
                    : isUnlocked
                    ? 'bg-white text-slate-800 border border-slate-200 shadow-2xs hover:border-blue-400 active:scale-95'
                    : 'bg-slate-100/80 text-slate-400 border border-slate-200/50 cursor-not-allowed opacity-60'
                }`}
              >
                {isUnlocked ? (
                  <>
                    <span className={`text-base font-bold ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                      {lvl.levelNumber}
                    </span>

                    {/* Star Icons for Completed Levels */}
                    {isCompleted ? (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-2.5 h-2.5 ${
                              s <= stars
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    ) : isCurrent ? (
                      <span className="text-[10px] font-medium text-blue-100 flex items-center gap-0.5">
                        <Play className="w-2 h-2 fill-current" /> Play
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-medium">
                        {lvl.arrows.length} arr
                      </span>
                    )}
                  </>
                ) : (
                  <Lock className="w-4 h-4 text-slate-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Resume Footer */}
      <footer className="p-3 bg-white border-t border-slate-100 shrink-0">
        <button
          id="resume-highest-level-btn"
          onClick={() => {
            soundEngine.playButtonClick();
            onSelectLevel(progress.highestUnlocked);
          }}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all"
        >
          <Sparkles className="w-4 h-4 text-blue-200" />
          <span>Continue Level {progress.highestUnlocked}</span>
        </button>
      </footer>
    </div>
  );
};
