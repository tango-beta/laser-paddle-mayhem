import React, { useEffect, useState } from 'react';
import { Camera, Check, Cpu, FlipHorizontal, X } from 'lucide-react';
import { handTracker } from '../vision/HandTracker';
import { soundSynth } from '../audio/SoundSynth';
import { musicSynth } from '../audio/MusicSynth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [mirror, setMirror] = useState<boolean>(true);
  const [ecoMode, setEcoMode] = useState<boolean>(false);
  const [soundVol, setSoundVol] = useState<number>(0.5);
  const [musicVol, setMusicVol] = useState<number>(0.35);

  useEffect(() => {
    if (isOpen) {
      handTracker.getAvailableCameras().then((cams) => {
        setDevices(cams);
        if (cams.length > 0 && !selectedDevice) {
          setSelectedDevice(cams[0].deviceId);
        }
      });
    }
  }, [isOpen, selectedDevice]);

  if (!isOpen) return null;

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    handTracker.initialize(deviceId);
  };

  const handleMirrorToggle = (val: boolean) => {
    setMirror(val);
    handTracker.setMirror(val);
  };

  const handleEcoToggle = (val: boolean) => {
    setEcoMode(val);
    handTracker.setEcoMode(val);
  };

  const handleSoundChange = (v: number) => {
    setSoundVol(v);
    soundSynth.setVolume(v);
  };

  const handleMusicChange = (v: number) => {
    setMusicVol(v);
    musicSynth.setVolume(v);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 select-none">
      <div className="cyber-card max-w-lg w-full p-6 rounded-2xl border border-cyber-neonCyan/40 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-cyber-border/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Camera className="text-cyber-neonCyan" size={20} />
            <h2 className="font-display font-bold text-lg text-slate-100 tracking-wider">
              SETTINGS & CALIBRATION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:text-cyber-neonPink text-slate-400 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Camera Selection */}
          <div>
            <label className="block font-display text-xs text-slate-300 mb-1.5 uppercase">
              Webcam Device
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#070712] border border-cyber-border text-slate-200 text-sm focus:outline-none focus:border-cyber-neonCyan font-mono cursor-pointer"
            >
              {devices.length > 0 ? (
                devices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))
              ) : (
                <option value="">Default Web Camera</option>
              )}
            </select>
          </div>

          {/* Mirror Camera Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-cyber-panel border border-cyber-border">
            <div className="flex items-center gap-2.5">
              <FlipHorizontal size={18} className="text-cyber-neonCyan" />
              <div>
                <span className="font-display text-xs text-slate-200 block">Mirror Camera</span>
                <span className="text-[11px] text-slate-400">Natural mirror movement (left moves left)</span>
              </div>
            </div>
            <button
              onClick={() => handleMirrorToggle(!mirror)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                mirror ? 'bg-cyber-neonCyan' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  mirror ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Chromebook Eco Mode */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-cyber-panel border border-cyber-border">
            <div className="flex items-center gap-2.5">
              <Cpu size={18} className="text-cyber-neonYellow" />
              <div>
                <span className="font-display text-xs text-slate-200 block">Chromebook / Low-Power Mode</span>
                <span className="text-[11px] text-slate-400">Downscales vision input for older CPUs</span>
              </div>
            </div>
            <button
              onClick={() => handleEcoToggle(!ecoMode)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                ecoMode ? 'bg-cyber-neonYellow' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  ecoMode ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Sound FX Volume */}
          <div>
            <div className="flex justify-between text-xs font-display text-slate-300 mb-1">
              <span>Sound Effects</span>
              <span className="font-mono">{Math.round(soundVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundVol}
              onChange={(e) => handleSoundChange(parseFloat(e.target.value))}
              className="w-full accent-cyber-neonCyan h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Music Volume */}
          <div>
            <div className="flex justify-between text-xs font-display text-slate-300 mb-1">
              <span>Synthwave Music</span>
              <span className="font-mono">{Math.round(musicVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVol}
              onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
              className="w-full accent-cyber-neonPink h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-cyber-border/80 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-lg bg-cyber-neonCyan text-[#070712] font-display font-bold text-xs tracking-wider cyber-btn flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={16} /> SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
