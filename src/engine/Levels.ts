import type { Brick, LevelDefinition, PowerUpType, BrickType } from '../types';
import { GAME_CONFIG } from '../config/gameConfig';

export class LevelManager {
  public static readonly TOTAL_CAMPAIGN_STAGES = 10;

  // Level definitions for Campaign mode
  public static getCampaignLevel(stage: number): LevelDefinition {
    switch (stage) {
      case 1:
        return {
          stage: 1,
          title: 'STAGE 1: SYSTEM BOOT',
          subtitle: 'Calibrate your lasers & smash the firewall',
          gridCols: 10,
          gridRows: 4,
          ballBaseSpeed: 7.0,
          layout: [
            ['standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard'],
            ['standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard'],
            ['standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard'],
            [null, 'standard', 'standard', 'standard', null, null, 'standard', 'standard', 'standard', null],
          ],
        };

      case 2:
        return {
          stage: 2,
          title: 'STAGE 2: DUAL CONDUIT',
          subtitle: 'Use both hands to defend left & right nodes',
          gridCols: 12,
          gridRows: 6,
          ballBaseSpeed: 7.5,
          layout: [
            ['standard', 'standard', 'armored', null, null, null, null, null, null, 'armored', 'standard', 'standard'],
            ['standard', 'standard', 'standard', null, null, null, null, null, null, 'standard', 'standard', 'standard'],
            ['standard', 'armored', 'standard', null, null, 'explosive', 'explosive', null, null, 'standard', 'armored', 'standard'],
            ['armored', 'standard', 'armored', null, null, 'standard', 'standard', null, null, 'armored', 'standard', 'armored'],
            ['standard', 'standard', 'standard', null, null, null, null, null, null, 'standard', 'standard', 'standard'],
            ['standard', 'prism', 'standard', null, null, null, null, null, null, 'standard', 'prism', 'standard'],
          ],
        };

      case 3:
        return {
          stage: 3,
          title: 'STAGE 3: DETONATION GRID',
          subtitle: 'Target explosive nodes for chain reactions',
          gridCols: 11,
          gridRows: 6,
          ballBaseSpeed: 7.5,
          layout: [
            ['armored', 'standard', 'explosive', 'standard', 'armored', 'standard', 'armored', 'standard', 'explosive', 'standard', 'armored'],
            ['standard', 'explosive', 'standard', 'explosive', 'standard', 'explosive', 'standard', 'explosive', 'standard', 'explosive', 'standard'],
            ['armored', 'standard', 'explosive', 'standard', 'armored', 'standard', 'armored', 'standard', 'explosive', 'standard', 'armored'],
            ['standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard'],
            [null, 'standard', 'armored', 'standard', null, 'prism', null, 'standard', 'armored', 'standard', null],
            [null, null, 'explosive', null, null, null, null, null, 'explosive', null, null],
          ],
        };

      case 4:
        return {
          stage: 4,
          title: 'STAGE 4: ARMORED FORTRESS',
          subtitle: 'Heavy plating detected - grab laser power-ups',
          gridCols: 10,
          gridRows: 7,
          ballBaseSpeed: 8.0,
          layout: [
            ['armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored'],
            ['armored', 'standard', 'standard', 'standard', 'armored', 'armored', 'standard', 'standard', 'standard', 'armored'],
            ['armored', 'standard', 'prism', 'standard', 'explosive', 'explosive', 'standard', 'prism', 'standard', 'armored'],
            ['armored', 'standard', 'standard', 'standard', 'armored', 'armored', 'standard', 'standard', 'standard', 'armored'],
            ['armored', 'armored', 'explosive', 'armored', 'armored', 'armored', 'armored', 'explosive', 'armored', 'armored'],
            [null, 'armored', 'standard', 'armored', null, null, 'armored', 'standard', 'armored', null],
            [null, null, 'armored', null, null, null, null, 'armored', null, null],
          ],
        };

      case 5:
        return {
          stage: 5,
          title: 'STAGE 5: KINETIC STREAM',
          subtitle: 'Narrow speed corridors and fast ricochets',
          gridCols: 12,
          gridRows: 7,
          ballBaseSpeed: 8.5,
          layout: [
            ['standard', null, 'standard', null, 'standard', null, null, 'standard', null, 'standard', null, 'standard'],
            ['armored', null, 'armored', null, 'armored', null, null, 'armored', null, 'armored', null, 'armored'],
            ['standard', 'prism', 'standard', 'prism', 'standard', 'explosive', 'explosive', 'standard', 'prism', 'standard', 'prism', 'standard'],
            ['armored', null, 'armored', null, 'armored', null, null, 'armored', null, 'armored', null, 'armored'],
            ['standard', null, 'standard', null, 'standard', null, null, 'standard', null, 'standard', null, 'standard'],
            ['standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard'],
            [null, 'armored', null, 'armored', null, 'armored', 'armored', null, 'armored', null, 'armored', null],
          ],
        };

      case 6:
        return {
          stage: 6,
          title: 'STAGE 6: MOVING BARRIER MATRIX',
          subtitle: 'Moving neon blockers reflect lasers dynamically',
          gridCols: 11,
          gridRows: 6,
          ballBaseSpeed: 8.5,
          layout: [
            ['moving', 'standard', 'moving', 'standard', 'moving', 'standard', 'moving', 'standard', 'moving', 'standard', 'moving'],
            ['standard', 'armored', 'standard', 'armored', 'standard', 'prism', 'standard', 'armored', 'standard', 'armored', 'standard'],
            ['moving', 'explosive', 'moving', 'explosive', 'moving', 'explosive', 'moving', 'explosive', 'moving', 'explosive', 'moving'],
            ['standard', 'armored', 'standard', 'armored', 'standard', 'armored', 'standard', 'armored', 'standard', 'armored', 'standard'],
            [null, 'moving', null, 'moving', null, 'moving', null, 'moving', null, 'moving', null],
            [null, null, 'prism', null, null, 'explosive', null, null, 'prism', null, null],
          ],
        };

      case 7:
        return {
          stage: 7,
          title: 'STAGE 7: PRISM CASCADE',
          subtitle: 'Multi-ball split overload - control the frenzy',
          gridCols: 12,
          gridRows: 6,
          ballBaseSpeed: 8.5,
          layout: [
            ['prism', 'prism', 'prism', 'prism', 'prism', 'prism', 'prism', 'prism', 'prism', 'prism', 'prism', 'prism'],
            ['standard', 'armored', 'standard', 'armored', 'standard', 'armored', 'standard', 'armored', 'standard', 'armored', 'standard', 'armored'],
            ['armored', 'explosive', 'armored', 'explosive', 'armored', 'explosive', 'armored', 'explosive', 'armored', 'explosive', 'armored', 'explosive'],
            ['standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard'],
            ['prism', null, 'prism', null, 'prism', null, null, 'prism', null, 'prism', null, 'prism'],
            [null, 'armored', null, 'armored', null, 'armored', 'armored', null, 'armored', null, 'armored', null],
          ],
        };

      case 8:
        return {
          stage: 8,
          title: 'STAGE 8: QUANTUM MAINFRAME',
          subtitle: 'Dense defensive layers and explosive nodes',
          gridCols: 12,
          gridRows: 8,
          ballBaseSpeed: 9.0,
          layout: [
            ['armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored'],
            ['armored', 'explosive', 'standard', 'standard', 'prism', 'armored', 'armored', 'prism', 'standard', 'standard', 'explosive', 'armored'],
            ['armored', 'standard', 'armored', 'standard', 'armored', 'explosive', 'explosive', 'armored', 'standard', 'armored', 'standard', 'armored'],
            ['armored', 'prism', 'standard', 'armored', 'standard', 'armored', 'armored', 'standard', 'armored', 'standard', 'prism', 'armored'],
            ['armored', 'standard', 'armored', 'standard', 'armored', 'prism', 'prism', 'armored', 'standard', 'armored', 'standard', 'armored'],
            ['armored', 'explosive', 'standard', 'standard', 'armored', 'armored', 'armored', 'armored', 'standard', 'standard', 'explosive', 'armored'],
            ['standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard', 'standard'],
            [null, 'moving', null, 'moving', null, 'moving', 'moving', null, 'moving', null, 'moving', null],
          ],
        };

      case 9:
        return {
          stage: 9,
          title: 'STAGE 9: THE NEON GAUNTLET',
          subtitle: 'Ultra high speed & dense hazard grid',
          gridCols: 12,
          gridRows: 8,
          ballBaseSpeed: 9.5,
          layout: [
            ['moving', 'armored', 'moving', 'armored', 'moving', 'armored', 'armored', 'moving', 'armored', 'moving', 'armored', 'moving'],
            ['explosive', 'prism', 'explosive', 'prism', 'explosive', 'prism', 'prism', 'explosive', 'prism', 'explosive', 'prism', 'explosive'],
            ['armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored'],
            ['standard', 'moving', 'standard', 'moving', 'standard', 'moving', 'moving', 'standard', 'moving', 'standard', 'moving', 'standard'],
            ['armored', 'explosive', 'armored', 'explosive', 'armored', 'explosive', 'explosive', 'armored', 'explosive', 'armored', 'explosive', 'armored'],
            ['prism', 'standard', 'prism', 'standard', 'prism', 'standard', 'standard', 'prism', 'standard', 'prism', 'standard', 'prism'],
            ['armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored', 'armored'],
            [null, 'moving', null, 'moving', null, 'explosive', 'explosive', null, 'moving', null, 'moving', null],
          ],
        };

      case 10:
      default:
        return {
          stage: 10,
          title: 'STAGE 10: CYBER CORE (BOSS)',
          subtitle: 'Destroy the Mother Core & shield satellites!',
          gridCols: 11,
          gridRows: 8,
          special: 'boss',
          ballBaseSpeed: 9.0,
          layout: [
            [null, null, null, 'boss_shield', 'boss_core', 'boss_core', 'boss_core', 'boss_shield', null, null, null],
            [null, null, 'boss_shield', 'boss_core', 'boss_core', 'boss_core', 'boss_core', 'boss_core', 'boss_shield', null, null],
            [null, 'boss_shield', 'boss_shield', 'boss_shield', 'boss_shield', 'boss_shield', 'boss_shield', 'boss_shield', 'boss_shield', 'boss_shield', null],
            ['moving', 'armored', 'explosive', 'armored', 'prism', 'explosive', 'prism', 'armored', 'explosive', 'armored', 'moving'],
            ['armored', 'moving', 'armored', 'moving', 'armored', 'boss_shield', 'armored', 'moving', 'armored', 'moving', 'armored'],
            ['prism', 'explosive', 'prism', 'explosive', 'prism', 'explosive', 'prism', 'explosive', 'prism', 'explosive', 'prism'],
            ['moving', 'standard', 'moving', 'standard', 'moving', 'standard', 'moving', 'standard', 'moving', 'standard', 'moving'],
            [null, 'armored', null, 'armored', null, 'prism', null, 'armored', null, 'armored', null],
          ],
        };
    }
  }

  // Generate bricks for a level layout
  public static createBricksFromLayout(
    level: LevelDefinition,
    canvasWidth: number = GAME_CONFIG.CANVAS_WIDTH
  ): Brick[] {
    const bricks: Brick[] = [];
    const layout = level.layout;
    const rows = layout.length;
    const cols = level.gridCols;

    const startY = 80;
    const padding = GAME_CONFIG.BRICK.PADDING;
    const totalPaddingX = (cols + 1) * padding;
    const availableWidth = canvasWidth - 100; // side margins
    const brickWidth = Math.floor((availableWidth - totalPaddingX) / cols);
    const brickHeight = 26;
    const startX = Math.floor((canvasWidth - (cols * brickWidth + (cols - 1) * padding)) / 2);

    let idCounter = 0;

    const powerUpTypes: PowerUpType[] = ['multiball', 'laser', 'plasma', 'wide', 'chrono', 'shield', 'extralife'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = layout[r][c];
        if (!type) continue;

        const bx = startX + c * (brickWidth + padding);
        const by = startY + r * (brickHeight + padding);
        const cfg = GAME_CONFIG.BRICK.TYPES[type];

        // Assign power-up drops probabilistically or specifically for prism/explosive
        let drop: PowerUpType | null = null;
        if (type === 'prism') {
          drop = 'multiball';
        } else if (Math.random() < GAME_CONFIG.POWERUPS.DROP_CHANCE) {
          drop = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        }

        const isMoving = type === 'moving';

        bricks.push({
          id: `brick_${level.stage}_${idCounter++}`,
          x: bx,
          y: by,
          width: brickWidth,
          height: brickHeight,
          type,
          hp: cfg.hp,
          maxHp: cfg.hp,
          color: cfg.color,
          points: cfg.points,
          powerupDrop: drop,
          vx: isMoving ? (c % 2 === 0 ? 1.5 : -1.5) : undefined,
          minX: isMoving ? bx - 60 : undefined,
          maxX: isMoving ? bx + 60 : undefined,
          pulsePhase: Math.random() * Math.PI * 2,
          isDead: false,
        });
      }
    }

    return bricks;
  }

  // Generate an Endless wave
  public static generateEndlessWave(
    waveNumber: number,
    canvasWidth: number = GAME_CONFIG.CANVAS_WIDTH
  ): Brick[] {
    const cols = 10;
    const rows = Math.min(6, 3 + Math.floor(waveNumber / 2));
    const layout: (BrickType | null)[][] = [];

    for (let r = 0; r < rows; r++) {
      const row: (BrickType | null)[] = [];
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.85 && r > 1) {
          row.push(null);
        } else {
          const rand = Math.random();
          if (rand < 0.45) row.push('standard');
          else if (rand < 0.7) row.push('armored');
          else if (rand < 0.82) row.push('explosive');
          else if (rand < 0.92) row.push('prism');
          else row.push('moving');
        }
      }
      layout.push(row);
    }

    const levelDef: LevelDefinition = {
      stage: waveNumber,
      title: `ENDLESS WAVE ${waveNumber}`,
      subtitle: `Survive the neon onslaught!`,
      gridCols: cols,
      gridRows: rows,
      ballBaseSpeed: Math.min(13, 7.5 + waveNumber * 0.4),
      layout,
    };

    return this.createBricksFromLayout(levelDef, canvasWidth);
  }

  // Generate Duel Mode arena bricks
  public static generateDuelArena(canvasWidth: number = GAME_CONFIG.CANVAS_WIDTH): Brick[] {
    const cols = 8;
    const rows = 3;
    const layout: (BrickType | null)[][] = [
      ['prism', 'standard', 'explosive', 'moving', 'moving', 'explosive', 'standard', 'prism'],
      ['armored', null, 'armored', 'standard', 'standard', 'armored', null, 'armored'],
      ['standard', 'prism', null, 'moving', 'moving', null, 'prism', 'standard'],
    ];

    const levelDef: LevelDefinition = {
      stage: 1,
      title: 'CYBER DUEL ARENA',
      subtitle: 'Deflect against AI Core Defender!',
      gridCols: cols,
      gridRows: rows,
      ballBaseSpeed: 8.0,
      layout,
      aiOpponent: true,
    };

    // Center in the middle Y
    const bricks = this.createBricksFromLayout(levelDef, canvasWidth);
    bricks.forEach((b) => {
      b.y += 180; // place in the arena center
    });
    return bricks;
  }
}
