import React, { useState } from 'react';
import { X, Volume2, VolumeX, Smartphone, Palette, Trash2, AlertTriangle } from 'lucide-react';
import { GameSettings } from '../types';
import { soundEngine } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetProgress,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const toggleSound = () => {
    const next = !settings.soundEnabled;
    soundEngine.setMuted(!next);
    if (next) soundEngine.playButtonClick();
    onUpdateSettings({ ...settings, soundEnabled: next });
  };

  const toggleVibration = () => {
    soundEngine.playButtonClick();
    onUpdateSettings({ ...settings, vibrationEnabled: !settings.vibrationEnabled });
  };

  const toggleTheme = () => {
    soundEngine.playButtonClick();
    onUpdateSettings({
      ...settings,
      boardTheme: settings.boardTheme === 'clean' ? 'warm' : 'clean',
    });
  };

  const handleResetConfirm = () => {
    soundEngine.playButtonClick();
    onResetProgress();
    setConfirmReset(false);
    onClose();
  };

  return (
    <div
      id="settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Settings</h2>
          <button
            id="close-settings"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 my-5">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-800">Sound Effects</div>
                <div className="text-xs text-slate-500">Procedural game audio</div>
              </div>
            </div>
            <button
              id="toggle-sound-button"
              onClick={toggleSound}
              className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors ${
                settings.soundEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                  settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Vibration / Haptics Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-800">Haptic Feedback</div>
                <div className="text-xs text-slate-500">Tactile vibrations</div>
              </div>
            </div>
            <button
              id="toggle-vibration-button"
              onClick={toggleVibration}
              className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors ${
                settings.vibrationEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                  settings.vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Board Theme */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-800">Board Style</div>
                <div className="text-xs text-slate-500">
                  {settings.boardTheme === 'clean' ? 'Minimal Pure White' : 'Warm Sandstone'}
                </div>
              </div>
            </div>
            <button
              id="toggle-theme-button"
              onClick={toggleTheme}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
            >
              {settings.boardTheme === 'clean' ? 'Pure White' : 'Warm'}
            </button>
          </div>

          {/* Reset Progress */}
          <div className="pt-2">
            {!confirmReset ? (
              <button
                id="reset-progress-button"
                onClick={() => setConfirmReset(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-red-200/80 bg-red-50/50 hover:bg-red-50 text-red-600 font-medium text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset All Game Progress</span>
              </button>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center gap-2 text-red-700 font-semibold text-xs mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Reset all 50 levels and stars?</span>
                </div>
                <p className="text-[11px] text-red-600/90 mb-2.5">
                  This cannot be undone. All completed levels will be locked again.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="py-1.5 px-3 rounded-lg bg-white text-slate-600 text-xs font-medium border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetConfirm}
                    className="py-1.5 px-3 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                  >
                    Yes, Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center pt-2 text-[11px] text-slate-400">
          Arrow Escape • 50 Progressive Levels • Offline Play
        </div>
      </div>
    </div>
  );
};
