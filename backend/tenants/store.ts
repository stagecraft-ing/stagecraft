/**
 * Tenancy data access on CoreLedger.
 *
 * Schema is ensured eagerly at service load (the auth service's pattern), so
 * the `tenant` and `installation` tables exist before the first request. The
 * mutation helpers below follow the chassis find-then-write-in-a-transaction
 * idiom (CoreLedger has no native upsert); the setup callback and webhook both
 * converge on `upsertInstallation`.
 */
import { ledger } from "../core/ledger";

import { Installation, type InstallationStatus, Tenant } from "./entities";

export const dbReady: Promise<void> = ledger().init([Tenant, Installation]);
dbReady.catch(() => {});

export { ledger };

export function tenants() {
  return ledger().repo(Tenant);
}

export function installations() {
  return ledger().repo(Installation);
}

/** Tenants owned by a user, newest first. */
export async function listTenantsForOwner(ownerUserId: string): Promise<Tenant[]> {
  await dbReady;
  return tenants().findWhere({ ownerUserId }, { orderBy: "createdAt", direction: "desc" });
}

/** A tenant the caller owns, or null (ownership check folded in to avoid leaks). */
export async function getOwnedTenant(id: string, ownerUserId: string): Promise<Tenant | null> {
  await dbReady;
  const tenant = await tenants().findById(id);
  if (!tenant || tenant.ownerUserId !== ownerUserId) return null;
  return tenant;
}

export async function listInstallationsForTenant(tenantId: string): Promise<Installation[]> {
  await dbReady;
  return installations().findWhere({ tenantId }, { orderBy: "createdAt", direction: "asc" });
}

export interface UpsertInstallationInput {
  tenantId: string;
  githubOrg: string;
  installationId: string;
  status: InstallationStatus;
}

/**
 * Bind (or refresh) an installation to a tenant. Keyed on the unique
 * `installationId`: a repeat setup callback for the same installation updates
 * org/status in place rather than duplicating.
 */
export async function upsertInstallation(input: UpsertInstallationInput): Promise<Installation> {
  await dbReady;
  const now = new Date();
  return ledger().transaction(async ({ repo }) => {
    const rows = repo(Installation);
    const existing = await rows.findOne({ installationId: input.installationId } as Partial<Installation>);
    if (existing) {
      await rows.updateById(existing.id, {
        tenantId: input.tenantId,
        githubOrg: input.githubOrg,
        status: input.status,
        updatedAt: now,
      });
      return (await rows.findById(existing.id))!;
    }
    const row = Object.assign(new Installation(), {
      tenantId: input.tenantId,
      githubOrg: input.githubOrg,
      installationId: input.installationId,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    });
    await rows.insert(row);
    return row;
  });
}

/**
 * Update the status of a KNOWN installation (webhook lifecycle events). An
 * installation we never bound to a tenant (e.g. installed directly from the
 * App page without going through our install-url) has no tenant to attach to,
 * so it is left alone and the caller logs+ignores.
 */
export async function setInstallationStatus(
  installationId: string,
  status: InstallationStatus,
): Promise<boolean> {
  await dbReady;
  const now = new Date();
  return ledger().transaction(async ({ repo }) => {
    const rows = repo(Installation);
    const existing = await rows.findOne({ installationId } as Partial<Installation>);
    if (!existing) return false;
    await rows.updateById(existing.id, { status, updatedAt: now });
    return true;
  });
}

/** The active installation for a tenant, if any (used by the repos endpoint). */
export async function activeInstallationForTenant(tenantId: string): Promise<Installation | null> {
  await dbReady;
  return installations().findOne({ tenantId, status: "active" } as Partial<Installation>);
}
