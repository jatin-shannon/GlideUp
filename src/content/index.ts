import type { Unit } from '../types';
import foundations from './units/foundations.json';
import glideRecord from './units/glide-record.json';
import businessRules from './units/business-rules.json';
import clientScripts from './units/client-scripts.json';
import { indexUnit } from '../lib/db';

/**
 * All units, ordered as they appear on the Home map. Units unlock in
 * sequence — a unit is unlocked once the previous one is complete.
 */
export const UNITS: Unit[] = [
  foundations as Unit,
  glideRecord as Unit,
  businessRules as Unit,
  clientScripts as Unit,
];

// Register every unit's exercise ids so db.ts can count unit progress.
UNITS.forEach(indexUnit);

export function getUnit(unitId: string): Unit | undefined {
  return UNITS.find((u) => u.unitId === unitId);
}

export function badgeLabel(badgeId: string): string {
  const unit = UNITS.find(
    (u) => `${u.certTier.toLowerCase()}-${u.unitId}` === badgeId,
  );
  if (unit) return `${unit.certTier}: ${unit.unitTitle}`;
  return badgeId;
}
