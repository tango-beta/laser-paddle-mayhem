export const GAME_CONFIG = {
  CANVAS_WIDTH: 960,
  CANVAS_HEIGHT: 720,
  
  PADDLE: {
    DEFAULT_WIDTH: 150, // Generous, comfortable paddle for webcam & touch
    WIDE_WIDTH: 210,
    HEIGHT: 20,
    Y_POSITION: 650,
    AI_Y_POSITION: 70,
    COLOR_LEFT: '#ff007f',   // Neon Pink
    COLOR_RIGHT: '#00f0ff',  // Neon Cyan
    COLOR_PRIMARY: '#ffe600',// Neon Yellow
    COLOR_AI: '#a855f7',     // Neon Purple
    MAX_TILT_ANGLE: Math.PI / 4, // 45 degrees
    SMOOTH_FACTOR: 0.28,
  },

  BALL: {
    RADIUS: 9,
    INITIAL_SPEED: 3.8, // Relaxed, approachable speed for hand tracking
    MAX_SPEED: 6.8,
    SPEED_INCREMENT: 0.005,
    COLOR_DEFAULT: '#00f0ff',
    COLOR_PLASMA: '#ff0055',
    COLOR_BOOST: '#ffe600',
  },

  BRICK: {
    PADDING: 6,
    BORDER_RADIUS: 4,
    TYPES: {
      standard: { hp: 1, points: 100, color: '#00f0ff' },
      armored: { hp: 2, points: 250, color: '#a855f7' },
      explosive: { hp: 1, points: 200, color: '#ff6600' },
      prism: { hp: 1, points: 300, color: '#00ff66' },
      boss_shield: { hp: 4, points: 500, color: '#ffe600' },
      boss_core: { hp: 20, points: 5000, color: '#ff0055' },
      moving: { hp: 2, points: 350, color: '#38bdf8' },
    }
  },

  POWERUPS: {
    DROP_CHANCE: 0.35,
    FALL_SPEED: 1.5, // Slow, comfortable falling speed to easily catch
    RADIUS: 15,
    DURATION: 14000, // 14 seconds active duration
    TYPES: {
      multiball: { name: 'MULTI-BALL', color: '#ffe600', icon: '⚡' },
      laser: { name: 'LASER CANNONS', color: '#ff007f', icon: '🔫' },
      plasma: { name: 'PLASMA PIERCE', color: '#ff3300', icon: '☄️' },
      wide: { name: 'WIDE SHIELD', color: '#00ff66', icon: '🛡️' },
      chrono: { name: 'CHRONO SLOW', color: '#38bdf8', icon: '⏱️' },
      shield: { name: 'BOTTOM BARRIER', color: '#a855f7', icon: '⚓' },
      extralife: { name: 'EXTRA LIFE', color: '#ec4899', icon: '❤️' },
    }
  },

  LASER: {
    SPEED: 8.5,
    WIDTH: 4,
    HEIGHT: 18,
    COOLDOWN: 150, // ms between laser bursts
    COLOR: '#00f0ff',
  },

  SCORING: {
    COMBO_TIMEOUT_MS: 3800,
    MAX_MULTIPLIER: 8,
  }
};
