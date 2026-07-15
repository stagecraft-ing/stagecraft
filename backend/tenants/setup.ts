/**
 * GET /github/setup (spec 004 §3): the App's Setup URL callback.
 *
 * After a user installs the App from the install URL we handed them, GitHub
 * redirects their browser here with `installation_id` and the `state` we
 * signed. We verify the state (recovering the tenant + user binding), confirm
 * the tenant is still owned by that user, verify the installation exists via an
 * App JWT (which also yields the org login), persist it, and bounce the browser
 * back to the webapp. No session auth: the signed, short-lived state is the
 * binding (spec 004 §3 permits HMAC-over-webhook-secret for v1).
 */
import { api } from "encore.dev/api";

import { logError, logInfo, logSecurityEvent } from "../lib/logger";
import { withinAuthRateLimit } from "../lib/rate-limit";

import { githubWebhookSecret, webappBaseUrl } from "./config";
import { getInstallation } from "./github-app";
import { clientIp, endText, redirect, requestUrl } from "./http";
import { verifyState } from "./state";
import { getOwnedTenant, upsertInstallation } from "./store";

export const setup = api.raw(
  { expose: true, method: "GET", path: "/github/setup" },
  async (req, res) => {
    if (!(await withinAuthRateLimit(clientIp(req)))) {
      res.setHeader("Retry-After", "60");
      endText(res, 429, "rate limit exceeded");
      return;
    }

    const url = requestUrl(req);
    const state = url.searchParams.get("state");
    const installationId = url.searchParams.get("installation_id");
    const binding = verifyState(githubWebhookSecret(), state);
    if (!binding || !installationId) {
      logSecurityEvent("github.setup.invalid_state");
      endText(res, 400, "invalid or expired setup callback");
      return;
    }

    const tenant = await getOwnedTenant(binding.tenantId, binding.userId);
    if (!tenant) {
      logSecurityEvent("github.setup.tenant_mismatch");
      endText(res, 404, "tenant not found");
      return;
    }

    try {
      const installation = await getInstallation(installationId);
      const githubOrg = installation.account?.login ?? "";
      await upsertInstallation({
        tenantId: binding.tenantId,
        githubOrg,
        installationId,
        status: "active",
      });
      logInfo("tenants.installation_persisted", { tenantId: binding.tenantId, githubOrg });
      redirect(
        res,
        `${webappBaseUrl()}/?github=installed&tenant=${encodeURIComponent(binding.tenantId)}`,
      );
    } catch (err) {
      logError("tenants.setup_verify_failed", {
        tenantId: binding.tenantId,
        message: err instanceof Error ? err.message : String(err),
      });
      redirect(
        res,
        `${webappBaseUrl()}/?github=error&tenant=${encodeURIComponent(binding.tenantId)}`,
      );
    }
  },
);
