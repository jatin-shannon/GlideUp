import { unitForExercise } from './index';

/**
 * ServiceNow reference links surfaced per question (the "Reference" fly-out in
 * a lesson). Links are keyed by unit, so every exercise in a unit shows the
 * canonical docs for that topic — at least one relevant link each.
 *
 * NOTE: these point at ServiceNow's developer API reference and product docs.
 * They couldn't be live-verified from the build environment (egress blocks
 * servicenow.com), so if any link doesn't land on the right page it's a
 * one-line fix here.
 */

export interface DocLink {
  title: string;
  url: string;
}

const API = 'https://developer.servicenow.com/dev.do#!/reference/api/xanadu';

export const UNIT_DOCS: Record<string, DocLink[]> = {
  foundations: [
    {
      title: 'GlideSystem (gs) — API reference',
      url: `${API}/server/no-namespace/c_GlideSystemScopedAPI`,
    },
  ],
  'glide-record': [
    {
      title: 'GlideRecord — API reference',
      url: `${API}/server/no-namespace/c_GlideRecordScopedAPI`,
    },
  ],
  'business-rules': [
    {
      title: 'Business rules — product docs',
      url: 'https://www.servicenow.com/docs/csh?topicname=c_BusinessRules.html&version=latest',
    },
    {
      title: 'GlideRecord (current / previous) — API reference',
      url: `${API}/server/no-namespace/c_GlideRecordScopedAPI`,
    },
  ],
  'client-scripts': [
    {
      title: 'GlideForm (g_form) — API reference',
      url: `${API}/client/no-namespace/c_GlideFormAPI`,
    },
    {
      title: 'Client scripts — product docs',
      url: 'https://www.servicenow.com/docs/csh?topicname=c_ClientScripts.html&version=latest',
    },
  ],
  'script-includes': [
    {
      title: 'Script includes — product docs',
      url: 'https://www.servicenow.com/docs/csh?topicname=c_ScriptInclude.html&version=latest',
    },
  ],
  'glide-ajax': [
    {
      title: 'GlideAjax — API reference',
      url: `${API}/client/no-namespace/c_GlideAjaxAPI`,
    },
  ],
  'ui-policies-actions': [
    {
      title: 'UI policies — product docs',
      url: 'https://www.servicenow.com/docs/csh?topicname=c_UIPolicy.html&version=latest',
    },
    {
      title: 'UI actions — product docs',
      url: 'https://www.servicenow.com/docs/csh?topicname=c_UIActions.html&version=latest',
    },
  ],
  'acls-security': [
    {
      title: 'Access control rules (ACLs) — product docs',
      url: 'https://www.servicenow.com/docs/csh?topicname=c_AccessControl.html&version=latest',
    },
  ],
  'scheduled-jobs': [
    {
      title: 'GlideSystem (eventQueue) — API reference',
      url: `${API}/server/no-namespace/c_GlideSystemScopedAPI`,
    },
    {
      title: 'Scheduled jobs — product docs',
      url: 'https://www.servicenow.com/docs/csh?topicname=c_ScheduledJobs.html&version=latest',
    },
  ],
  notifications: [
    {
      title: 'Email notifications — product docs',
      url: 'https://www.servicenow.com/docs/csh?topicname=c_EmailNotifications.html&version=latest',
    },
  ],
  'glide-aggregate': [
    {
      title: 'GlideAggregate — API reference',
      url: `${API}/server/no-namespace/c_GlideAggregateScopedAPI`,
    },
  ],
  'rest-outbound': [
    {
      title: 'RESTMessageV2 — API reference',
      url: `${API}/server/sn_ws-namespace/c_RESTMessageV2ScopedAPI`,
    },
  ],
  'scripted-rest': [
    {
      title: 'Scripted REST APIs — product docs',
      url: 'https://www.servicenow.com/docs/csh?topicname=c_ScriptedRESTAPIs.html&version=latest',
    },
  ],
  'import-transform': [
    {
      title: 'Transform maps — product docs',
      url: 'https://www.servicenow.com/docs/csh?topicname=c_CreateATransformMap.html&version=latest',
    },
  ],
  'flow-designer': [
    {
      title: 'Flow Designer — product docs',
      url: 'https://www.servicenow.com/docs/csh?topicname=flow-designer.html&version=latest',
    },
  ],
  'best-practices': [
    {
      title: 'Scripting technical best practices — developer guide',
      url: 'https://developer.servicenow.com/dev.do#!/guides/xanadu/now-platform/tpb-guide/scripting_technical_best_practices',
    },
    {
      title: 'GlideRecord — API reference',
      url: `${API}/server/no-namespace/c_GlideRecordScopedAPI`,
    },
  ],
};

/** Reference links for the unit that owns a given exercise (works in reviews). */
export function docsForExercise(exerciseId: string): DocLink[] {
  const unit = unitForExercise(exerciseId);
  return (unit && UNIT_DOCS[unit.unitId]) ?? [];
}
