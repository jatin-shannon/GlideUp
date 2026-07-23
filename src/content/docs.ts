import { unitForExercise } from './index';

/**
 * ServiceNow reference links surfaced per question (the "Reference" fly-out in
 * a lesson). Links are keyed by unit, so every exercise in a unit shows the
 * canonical docs for that topic — at least one relevant link each.
 *
 * URLs use ServiceNow's version-agnostic docs short-links
 * (www.servicenow.com/docs/r/...) so they track the current release, and were
 * gathered from ServiceNow's own indexed documentation pages.
 */

export interface DocLink {
  title: string;
  url: string;
}

const R = 'https://www.servicenow.com/docs/r';

const GLIDE_RECORD = {
  title: 'GlideRecord — API reference',
  url: `${R}/api-reference/server-api-reference/c_GlideRecordAPI.html`,
};
const GLIDE_SYSTEM = {
  title: 'GlideSystem (gs) — API reference',
  url: `${R}/api-reference/server-api-reference/c_GlideSystemScopedAPI.html`,
};
const GLIDE_AGGREGATE = {
  title: 'GlideAggregate — API reference',
  url: `${R}/api-reference/server-api-reference/c_GlideAggregateScopedAPI.html`,
};

export const UNIT_DOCS: Record<string, DocLink[]> = {
  foundations: [GLIDE_SYSTEM],
  'glide-record': [GLIDE_RECORD],
  'business-rules': [
    {
      title: 'Business rules — product docs',
      url: `${R}/xanadu/application-development/business-rules-classic/c_BusinessRules.html`,
    },
    GLIDE_RECORD,
  ],
  'client-scripts': [
    {
      title: 'GlideForm (g_form) — API reference',
      url: `${R}/api-reference/c_GlideFormAPI.html`,
    },
    {
      title: 'Client scripts — product docs',
      url: `${R}/yokohama/application-development/scripts/client-scripts.html`,
    },
  ],
  'script-includes': [
    {
      title: 'Script includes — product docs',
      url: `${R}/api-reference/scripts/c_ScriptIncludes.html`,
    },
  ],
  'glide-ajax': [
    {
      title: 'GlideAjax — API reference',
      url: `${R}/api-reference/c_GlideAjaxAPI.html`,
    },
  ],
  'ui-policies-actions': [
    {
      title: 'UI policies — product docs',
      url: `${R}/platform-administration/t_CreateAUIPolicy.html`,
    },
  ],
  'acls-security': [
    {
      title: 'Access control rules (ACLs) — product docs',
      url: `${R}/platform-security/access-control/t_CreateAnACLRule.html`,
    },
  ],
  'scheduled-jobs': [
    {
      title: 'Scheduled script execution — product docs',
      url: `${R}/platform-administration/time-configuration/t_ScheduleAScriptExecution.html`,
    },
    GLIDE_SYSTEM,
  ],
  notifications: [
    {
      title: 'Email notifications — product docs',
      url: `${R}/platform-administration/t_CreateANotification.html`,
    },
  ],
  'glide-aggregate': [GLIDE_AGGREGATE],
  'rest-outbound': [
    {
      title: 'RESTMessageV2 — API reference',
      url: `${R}/api-reference/server-api-reference/c_RESTMessageV2API.html`,
    },
  ],
  'scripted-rest': [
    {
      title: 'Scripted REST APIs — product docs',
      url: `${R}/api-reference/rest-api-explorer/t_CreateAScriptedRESTService.html`,
    },
  ],
  'import-transform': [
    {
      title: 'Transform maps — product docs',
      url: `${R}/integrate-applications/system-import-sets/c_CreatingNewTransformMaps.html`,
    },
  ],
  'flow-designer': [
    {
      title: 'Flow Designer — product docs',
      url: `${R}/application-development/flow-designer.html`,
    },
  ],
  'best-practices': [GLIDE_RECORD, GLIDE_AGGREGATE],
};

/** Reference links for the unit that owns a given exercise (works in reviews). */
export function docsForExercise(exerciseId: string): DocLink[] {
  const unit = unitForExercise(exerciseId);
  return (unit && UNIT_DOCS[unit.unitId]) ?? [];
}
