import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../engine/GameEngine';
import type { ActivePowerUp, GameMode, GameState, GameStats } from '../types';
import { GAME_CONFIG } from '../config/gameConfig';
import { handTracker } from '../vision/HandTracker';
import { soundSynth } from '../audio/SoundSynth';
import { musicSynth } from '../audio/MusicSynth';
import { ScoreHUD } from './ScoreHUD';
import { CameraFeedPreview } from './CameraFeedPreview';
import { StartMenu } from './StartMenu';
import { GameOverModal } from './GameOverModal';
import { SettingsModal } from './SettingsModal';
import { HelpModal } from './HelpModal';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('arcade');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    lives: 3,
    maxLives: 3,
    combo: 0,
    maxCombo: 0,
    multiplier: 1,
    stage: 1,
    totalStages: 10,
    bricksRemaining: 0,
    timeElapsed: 0,
    ballsInPlay: 0,
  });
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isInitializingCamera, setIsInitializingCamera] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set fixed internal logical resolution
    canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    canvas.height = GAME_CONFIG.CANVAS_HEIGHT;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    const unsub = engine.subscribe((newStats, newState, powers) => {
      setStats({ ...newStats });
      setGameState(newState);
      setActivePowerUps([...powers]);
      setIsPaused(newState === 'paused');
    });

    const unsubTracker = handTracker.subscribe((tState) => {
      setIsCameraReady(tState.isReady);
    });

    return () => {
      unsub();
      unsubTracker();
      engine.destroy();
      handTracker.stop();
    };
  }, []);

  const handleStartGame = async (withWebcam: boolean) => {
    if (withWebcam) {
      setIsInitializingCamera(true);
      const success = await handTracker.initialize();
      setIsInitializingCamera(false);
      if (!success) {
        // Fallback to mouse mode automatically
        console.log('Starting with mouse fallback');
      }
    }
    if (engineRef.current) {
      engineRef.current.startGame(gameMode, 1);
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.restart();
    }
  };

  const handleHome = () => {
    if (engineRef.current) {
      engineRef.current.state = 'menu';
      engineRef.current.stopLoop();
      setGameState('menu');
    }
  };

  const handleTogglePause = () => {
    if (engineRef.current) {
      engineRef.current.togglePause();
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundSynth.setMuted(nextMute);
    musicSynth.setMuted(nextMute);
  };

  // Mouse & Touch Interaction Handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_CONFIG.CANVAS_WIDTH / rect.width;
    const scaleY = GAME_CONFIG.CANVAS_HEIGHT / rect.height;

    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;

    engineRef.current.setMouseInput(clientX, clientY, e.buttons > 0);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_CONFIG.CANVAS_WIDTH / rect.width;
    const scaleY = GAME_CONFIG.CANVAS_HEIGHT / rect.height;

    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;

    engineRef.current.setMouseInput(clientX, clientY, true);
  };

  const handlePointerUp = () => {
    if (!engineRef.current) return;
    engineRef.current.setMouseInput(
      GAME_CONFIG.CANVAS_WIDTH / 2,
      GAME_CONFIG.PADDLE.Y_POSITION,
      false
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen flex items-center justify-center bg-[#070712] overflow-hidden scanlines"
    >
      {/* Game Canvas */}
      <div className="relative aspect-[4/3] w-full max-w-[960px] max-h-[100vh] shadow-2xl overflow-hidden rounded-none sm:rounded-xl border border-cyber-border/40">
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="w-full h-full block cursor-crosshair touch-none"
        />

        {/* In-Game HUD overlay */}
        {gameState !== 'menu' && (
          <>
            <ScoreHUD
              stats={stats}
              mode={gameMode}
              isPaused={isPaused}
              isMuted={isMuted}
              activePowerUps={activePowerUps}
              onTogglePause={handleTogglePause}
              onToggleMute={handleToggleMute}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />

            <CameraFeedPreview onToggleSettings={() => setIsSettingsOpen(true)} />
          </>
        )}

        {/* Start Menu */}
        {gameState === 'menu' && (
          <StartMenu
            highScore={stats.highScore}
            isCameraReady={isCameraReady}
            isInitializingCamera={isInitializingCamera}
            selectedMode={gameMode}
            onSelectMode={setGameMode}
            onStartGame={handleStartGame}
            onOpenHelp={() => setIsHelpOpen(true)}
          />
        )}

        {/* Game Over / Victory Modal */}
        {(gameState === 'gameover' || gameState === 'victory') && (
          <GameOverModal
            state={gameState}
            stats={stats}
            onRestart={handleRestart}
            onHome={handleHome}
          />
        )}

        {/* Pause Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="cyber-card p-6 rounded-xl border border-cyber-neonCyan text-center">
              <h3 className="font-display text-2xl font-black text-cyber-neonCyan mb-2">GAME PAUSED</h3>
              <button
                onClick={handleTogglePause}
                className="mt-3 px-6 py-2 rounded bg-cyber-neonCyan text-black font-display font-bold text-sm cyber-btn cursor-pointer"
              >
                RESUME
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
