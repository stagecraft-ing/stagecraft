import { Service } from "encore.dev/service";

import { apiRateLimit } from "../lib/rate-limit";

// The tenancy spine (spec 004). Encore auto-discovers a service by this file;
// the general API rate-limit tier is mounted here (spec 004 §3), keyed per
// client by the chassis lib/rate-limit middleware. The two GitHub-facing raw
// handlers (/github/setup, /github/webhook) additionally guard themselves:
// setup with the tighter auth tier, webhook with HMAC signature verification.
export default new Service("tenants", { middlewares: [apiRateLimit] });
