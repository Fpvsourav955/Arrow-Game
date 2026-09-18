import React, { useState, useEffect } from 'react';
import { ScreenState, GameProgress, GameSettings } from './types';
import { getLevel, ALL_LEVELS } from './data/levels';
import { HomeScreen } from './components/HomeScreen';
import { LevelSelectScreen } from './components/LevelSelectScreen';
import { GameScreen } from './components/GameScreen';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import {
  loadGameProgress,
  saveGameProgress,
  loadGameSettings,
  saveGameSettings,
  resetGameProgress,
} from './utils/storage';
import { soundEngine } from './utils/audio';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('HOME');
  const [currentLevelNumber, setCurrentLevelNumber] = useState<number>(1);
  const [progress, setProgress] = useState<GameProgress>(loadGameProgress);
  const [settings, setSettings] = useState<GameSettings>(loadGameSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);

  // Sync initial sound setting with soundEngine
  useEffect(() => {
    soundEngine.setMuted(!settings.soundEnabled);
  }, [settings.soundEnabled]);

  const handleStartPlay = () => {
    setCurrentLevelNumber(progress.highestUnlocked);
    setScreen('GAME');
  };

  const handleSelectLevel = (levelNumber: number) => {
    setCurrentLevelNumber(levelNumber);
    setScreen('GAME');
  };

  const handleNextLevel = (nextLevelNumber: number) => {
    if (nextLevelNumber <= ALL_LEVELS.length) {
      setCurrentLevelNumber(nextLevelNumber);
    } else {
      setScreen('LEVEL_SELECT');
    }
  };

  const handleUpdateProgress = (updatedProgress: GameProgress) => {
    setProgress(updatedProgress);
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    saveGameSettings(newSettings);
  };

  const handleResetProgress = () => {
    const reset = resetGameProgress();
    setProgress(reset);
    setCurrentLevelNumber(1);
    setScreen('HOME');
  };

  const currentLevel = getLevel(currentLevelNumber) || ALL_LEVELS[0];

  return (
    <div
      id="app-container"
      className="min-h-screen w-full bg-slate-900/5 flex items-center justify-center p-0 md:p-4 font-sans antialiased text-slate-900"
    >
      <div className="w-full h-screen md:h-[880px] md:max-h-[94vh] max-w-md bg-white md:rounded-3xl shadow-2xl overflow-hidden relative flex flex-col">
        {screen === 'HOME' && (
          <HomeScreen
            progress={progress}
            onPlay={handleStartPlay}
            onOpenLevelSelect={() => setScreen('LEVEL_SELECT')}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {screen === 'LEVEL_SELECT' && (
          <LevelSelectScreen
            progress={progress}
            onSelectLevel={handleSelectLevel}
            onBack={() => setScreen('HOME')}
          />
        )}

        {screen === 'GAME' && (
          <GameScreen
            level={currentLevel}
            progress={progress}
            settings={settings}
            onBack={() => setScreen('LEVEL_SELECT')}
            onNextLevel={handleNextLevel}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onUpdateProgress={handleUpdateProgress}
          />
        )}

        {/* Global Modals */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResetProgress={handleResetProgress}
        />

        <HowToPlayModal
          isOpen={isHowToPlayOpen}
          onClose={() => setIsHowToPlayOpen(false)}
        />
      </div>
    </div>
  );
}
