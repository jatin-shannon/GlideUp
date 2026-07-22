import type { Unit } from '../types';
import foundations from './units/foundations.json';
import glideRecord from './units/glide-record.json';
import businessRules from './units/business-rules.json';
import clientScripts from './units/client-scripts.json';
import scriptIncludes from './units/script-includes.json';
import glideAjax from './units/glide-ajax.json';
import uiPoliciesActions from './units/ui-policies-actions.json';
import aclsSecurity from './units/acls-security.json';
import scheduledJobs from './units/scheduled-jobs.json';
import notifications from './units/notifications.json';
import glideAggregate from './units/glide-aggregate.json';
import restOutbound from './units/rest-outbound.json';
import scriptedRest from './units/scripted-rest.json';
import importTransform from './units/import-transform.json';
import flowDesigner from './units/flow-designer.json';
import bestPractices from './units/best-practices.json';
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
  scriptIncludes as Unit,
  glideAjax as Unit,
  uiPoliciesActions as Unit,
  aclsSecurity as Unit,
  scheduledJobs as Unit,
  notifications as Unit,
  glideAggregate as Unit,
  restOutbound as Unit,
  scriptedRest as Unit,
  importTransform as Unit,
  flowDesigner as Unit,
  bestPractices as Unit,
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
