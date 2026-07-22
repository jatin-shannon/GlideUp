import { getUnit } from './index';

/**
 * The full curriculum roadmap — the single, maintainable source of truth for
 * the learning path, including units that aren't built yet and the cumulative
 * Checkpoint reviews. To add or reorder the journey, edit this list; both the
 * Home path and the Roadmap screen render from it.
 *
 * A unit node is "live" (playable) as soon as a matching content file exists
 * (see `isNodeLive`), so shipping a unit's JSON flips it on automatically.
 */

export type Tier = 'CSA' | 'CAD' | 'CIS' | 'Review';
export type NodeKind = 'unit' | 'checkpoint';

export interface RoadmapNode {
  /** For units, matches the content `unitId`. Unique across the roadmap. */
  id: string;
  order: number;
  kind: NodeKind;
  title: string;
  tier: Tier;
  focus: string;
  apis: string[];
  /** For checkpoints: the unit orders this review draws from. */
  reviewOf?: number[];
}

export const ROADMAP: RoadmapNode[] = [
  {
    id: 'foundations',
    order: 1,
    kind: 'unit',
    title: 'Foundations',
    tier: 'CSA',
    focus: 'JavaScript in the ServiceNow context — variables, functions, and gs.*.',
    apis: ['gs.info()', 'var', 'hasRole()', 'GlideDateTime'],
  },
  {
    id: 'glide-record',
    order: 2,
    kind: 'unit',
    title: 'GlideRecord',
    tier: 'CSA',
    focus: 'Query, insert, update, and delete records with the GlideRecord API.',
    apis: ['new GlideRecord()', 'addQuery()', 'query()', 'next()'],
  },
  {
    id: 'business-rules',
    order: 3,
    kind: 'unit',
    title: 'Business Rules',
    tier: 'CAD',
    focus: 'Server-side automation — current/previous, when-to-run, aborting.',
    apis: ['current', 'previous', 'setAbortAction()'],
  },
  {
    id: 'client-scripts',
    order: 4,
    kind: 'unit',
    title: 'Client Scripts',
    tier: 'CAD',
    focus: 'Client-side form logic that reacts as users load, type, and submit.',
    apis: ['g_form', 'onChange', 'setMandatory()'],
  },
  {
    id: 'checkpoint-1',
    order: 5,
    kind: 'checkpoint',
    title: 'Checkpoint I',
    tier: 'Review',
    focus: 'A cumulative review that re-tests everything from units 1–4.',
    apis: [],
    reviewOf: [1, 2, 3, 4],
  },
  {
    id: 'script-includes',
    order: 6,
    kind: 'unit',
    title: 'Script Includes',
    tier: 'CAD',
    focus: 'Reusable server-side classes — the backbone of maintainable code.',
    apis: ['Class.create()', 'prototype', 'AbstractAjaxProcessor'],
  },
  {
    id: 'glide-ajax',
    order: 7,
    kind: 'unit',
    title: 'GlideAjax',
    tier: 'CAD',
    focus: 'Call server-side Script Includes from the client, asynchronously.',
    apis: ['new GlideAjax()', 'addParam()', 'getXMLAnswer()'],
  },
  {
    id: 'ui-policies-actions',
    order: 8,
    kind: 'unit',
    title: 'UI Policies & Actions',
    tier: 'CAD',
    focus: 'Shape form behavior declaratively, and add buttons that run code.',
    apis: ['UI Policy', 'UI Action', 'setRedirectURL()'],
  },
  {
    id: 'acls-security',
    order: 9,
    kind: 'unit',
    title: 'ACLs & Security',
    tier: 'CIS',
    focus: 'Control who can read and write what — the security layer.',
    apis: ['ACL', 'canRead()', 'canWrite()', 'roles'],
  },
  {
    id: 'checkpoint-2',
    order: 10,
    kind: 'checkpoint',
    title: 'Checkpoint II',
    tier: 'Review',
    focus: 'The full cumulative review across units 1–9.',
    apis: [],
    reviewOf: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    id: 'scheduled-jobs',
    order: 11,
    kind: 'unit',
    title: 'Scheduled Jobs & Events',
    tier: 'CAD',
    focus: 'Run code on a schedule and fire events for asynchronous work.',
    apis: ['gs.eventQueue()', 'GlideDateTime', 'Scheduled Script'],
  },
  {
    id: 'notifications',
    order: 12,
    kind: 'unit',
    title: 'Notifications & Email',
    tier: 'CSA',
    focus: 'Event-driven email notifications and mail scripts.',
    apis: ['event', 'mail_script', '${field}'],
  },
  {
    id: 'glide-aggregate',
    order: 13,
    kind: 'unit',
    title: 'GlideAggregate & Efficiency',
    tier: 'CAD',
    focus: 'Count and sum records at the database without loading them.',
    apis: ['new GlideAggregate()', 'addAggregate()', 'getAggregate()'],
  },
  {
    id: 'rest-outbound',
    order: 14,
    kind: 'unit',
    title: 'REST Integration (Outbound)',
    tier: 'CIS',
    focus: 'Call external APIs from ServiceNow with RESTMessageV2.',
    apis: ['sn_ws.RESTMessageV2', 'setRequestBody()', 'execute()'],
  },
  {
    id: 'checkpoint-3',
    order: 15,
    kind: 'checkpoint',
    title: 'Checkpoint III',
    tier: 'Review',
    focus: 'A cumulative review across units 1–14.',
    apis: [],
    reviewOf: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  },
  {
    id: 'scripted-rest',
    order: 16,
    kind: 'unit',
    title: 'Scripted REST APIs (Inbound)',
    tier: 'CIS',
    focus: 'Expose your own REST endpoints for external systems to call.',
    apis: ['Scripted REST Resource', 'request', 'response'],
  },
  {
    id: 'import-transform',
    order: 17,
    kind: 'unit',
    title: 'Import Sets & Transform Maps',
    tier: 'CIS',
    focus: 'Load external data and map it onto target tables with scripts.',
    apis: ['source', 'target', 'onBefore', 'onAfter'],
  },
  {
    id: 'flow-designer',
    order: 18,
    kind: 'unit',
    title: 'Flow Designer & Actions',
    tier: 'CAD',
    focus: 'Automate processes with triggers, actions, and inline scripts.',
    apis: ['Trigger', 'Action', 'Flow logic'],
  },
  {
    id: 'best-practices',
    order: 19,
    kind: 'unit',
    title: 'Scripting Best Practices',
    tier: 'CAD',
    focus: 'Write efficient, secure, maintainable server-side code.',
    apis: ['setLimit()', 'setWorkflow(false)', 'GlideRecordSecure'],
  },
  {
    id: 'checkpoint-4',
    order: 20,
    kind: 'checkpoint',
    title: 'Checkpoint IV · Capstone',
    tier: 'Review',
    focus: 'The final capstone review spanning the entire curriculum, units 1–19.',
    apis: [],
    reviewOf: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    ],
  },
];

/** Tier accent colors, shared by the Home path and the Roadmap screen. */
export const TIER_COLOR: Record<Tier, string> = {
  CSA: '#38bdf8',
  CAD: '#a78bfa',
  CIS: '#34d399',
  Review: '#fbbf24',
};

export const TIER_LABEL: Record<Tier, string> = {
  CSA: 'CSA · Administrator',
  CAD: 'CAD · App Developer',
  CIS: 'CIS · Implementation',
  Review: 'Checkpoint review',
};

/** A unit node is playable once its content file is registered. */
export function isNodeLive(node: RoadmapNode): boolean {
  return node.kind === 'unit' && getUnit(node.id) !== undefined;
}
