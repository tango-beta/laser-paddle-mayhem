import type { HandData, HandLandmark } from '../types';

export class GestureRecognizer {
  // Normalize distance by hand scale (wrist to middle MCP)
  public static calculateHandScale(landmarks: HandLandmark[]): number {
    if (!landmarks || landmarks.length < 10) return 0.1;
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    const dx = middleMcp.x - wrist.x;
    const dy = middleMcp.y - wrist.y;
    return Math.sqrt(dx * dx + dy * dy) || 0.1;
  }

  // Calculate hand tilt angle in radians (-PI/4 to +PI/4 typical range)
  public static calculateTilt(landmarks: HandLandmark[]): number {
    if (!landmarks || landmarks.length < 10) return 0;
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    
    // Normal vector from wrist to middle MCP
    const dx = middleMcp.x - wrist.x;
    const dy = middleMcp.y - wrist.y;

    // Angle relative to vertical (upwards is negative Y in screen space)
    // 0 is straight up, negative is tilted left, positive is tilted right
    const angle = Math.atan2(dx, -dy);
    
    // Clamp to -45 to +45 degrees for gameplay stability
    const maxTilt = Math.PI / 4;
    return Math.max(-maxTilt, Math.min(maxTilt, angle));
  }

  // Calculate pinch state between thumb tip and index tip
  public static detectPinch(landmarks: HandLandmark[], handScale: number): { isPinching: boolean; distance: number } {
    if (!landmarks || landmarks.length < 9) return { isPinching: false, distance: 1 };
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];

    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const rawDist = Math.sqrt(dx * dx + dy * dy);
    const normalizedDist = rawDist / handScale;

    // Threshold ~0.35 of hand scale represents fingers touching
    return {
      isPinching: normalizedDist < 0.35,
      distance: normalizedDist
    };
  }

  // Detect if hand is a closed fist
  public static detectFist(landmarks: HandLandmark[], handScale: number): boolean {
    if (!landmarks || landmarks.length < 21) return false;
    const wrist = landmarks[0];
    const tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];

    let totalDist = 0;
    for (const tip of tips) {
      const dx = tip.x - wrist.x;
      const dy = tip.y - wrist.y;
      totalDist += Math.sqrt(dx * dx + dy * dy);
    }
    const avgDist = totalDist / (tips.length * handScale);
    return avgDist < 0.85;
  }

  // Calculate palm center coordinate
  public static getPalmCenter(landmarks: HandLandmark[]): { x: number; y: number } {
    if (!landmarks || landmarks.length < 18) return { x: 0.5, y: 0.5 };
    // Average wrist (0), index MCP (5), and pinky MCP (17)
    const x = (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3;
    const y = (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3;
    return { x, y };
  }

  // Detect proximity / clap between left and right hands
  public static detectClap(leftHand: HandData | null, rightHand: HandData | null): boolean {
    if (!leftHand || !rightHand) return false;
    const dx = leftHand.palmCenter.x - rightHand.palmCenter.x;
    const dy = leftHand.palmCenter.y - rightHand.palmCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < 0.15; // Closer than 15% of screen width/height
  }
}
