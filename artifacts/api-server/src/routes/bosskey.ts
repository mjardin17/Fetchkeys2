import { Router, type IRouter } from "express";
import {
  CreateBossKeyInventoryItemBody,
  DiscoverBossListerBody,
  GetBossKeyProviderParams,
  ListBossKeyProvidersQueryParams,
  ListBossKeyInventoryQueryParams,
  ResumeBossKeyWorkflowParams,
  UpdateBossKeyInventoryItemBody,
  UpdateBossKeyInventoryItemParams,
  GetBossKeyOverviewResponse,
  DiscoverBossListerResponse,
  ListBossKeyProvidersResponse,
  GetBossKeyProviderResponse,
  ValidateBossKeyProviderResponse,
  GetBossKeyVaultStatusResponse,
  LockBossKeyVaultResponse,
  ListBossKeyWorkflowsResponse,
  ResumeBossKeyWorkflowResponse,
  ListBossKeyInventoryResponse,
  CreateBossKeyInventoryItemResponse,
  UpdateBossKeyInventoryItemResponse,
} from "@workspace/api-zod";

type Provider = {
  slug: string;
  name: string;
  category: string;
  status: string;
  accessType: string;
  docsUrl: string;
  developerUrl: string;
  scopes: string[];
  environments: string[];
  nextAction: string;
  lastVerified: string;
  validationMessage: string | null;
  supports: string[];
};

type Workflow = {
  id: string;
  providerSlug: string;
  action: string;
  state: string;
  progress: number;
  checkpoint: string;
  updatedAt: string;
  nextAction: string | null;
};

type InventoryItem = {
  id: string;
  category: string;
  title: string;
  sku: string;
  quantity: number;
  price: number;
  cost: number;
  status: string;
  metadata?: Record<string, unknown>;
};

const now = "2026-08-15T12:00:00.000Z";

const providers: Provider[] = [
  {
    slug: "supabase",
    name: "Supabase",
    category: "infrastructure",
    status: "NEEDS_AUTHORIZATION",
    accessType: "API_KEY_AVAILABLE",
    docsUrl: "https://supabase.com/docs",
    developerUrl: "https://supabase.com/dashboard",
    scopes: ["database.read", "database.write", "storage"],
    environments: ["development", "sandbox", "production"],
    nextAction: "Authorize a project-owned service role",
    lastVerified: "Never",
    validationMessage: "No local grant has been stored.",
    supports: ["database", "storage", "webhooks"],
  },
  {
    slug: "openai",
    name: "OpenAI",
    category: "ai",
    status: "NEEDS_AUTHORIZATION",
    accessType: "API_KEY_AVAILABLE",
    docsUrl: "https://platform.openai.com/docs",
    developerUrl: "https://platform.openai.com/api-keys",
    scopes: ["models.read", "responses.create"],
    environments: ["development", "production"],
    nextAction: "Add an authorized project key to the encrypted vault",
    lastVerified: "Never",
    validationMessage: "Credential metadata is required before validation.",
    supports: ["ai enrichment", "image recognition"],
  },
  {
    slug: "github",
    name: "GitHub",
    category: "development",
    status: "OAUTH_AVAILABLE",
    accessType: "OAUTH_PKCE",
    docsUrl: "https://docs.github.com/en/rest",
    developerUrl: "https://github.com/settings/developers",
    scopes: ["repo", "read:org", "workflow"],
    environments: ["development", "production"],
    nextAction: "Start the official OAuth authorization flow",
    lastVerified: "Never",
    validationMessage: "Waiting for project authorization.",
    supports: ["repository discovery", "environment inspection"],
  },
  {
    slug: "ebay",
    name: "eBay",
    category: "marketplace",
    status: "OAUTH_AVAILABLE",
    accessType: "OAUTH_PKCE",
    docsUrl: "https://developer.ebay.com/api-docs/static/overview.html",
    developerUrl: "https://developer.ebay.com/my/keys",
    scopes: ["https://api.ebay.com/oauth/api_scope", "sell.inventory", "sell.fulfillment"],
    environments: ["sandbox", "production"],
    nextAction: "Authorize seller account for inventory and fulfillment",
    lastVerified: "Never",
    validationMessage: "Seller consent is required.",
    supports: ["listing creation", "inventory updates", "orders"],
  },
  {
    slug: "amazon-sp-api",
    name: "Amazon Selling Partner API",
    category: "marketplace",
    status: "PARTNER_ACCESS_REQUIRED",
    accessType: "LWA + developer registration",
    docsUrl: "https://developer-docs.amazon.com/sp-api/",
    developerUrl: "https://developer.amazonservices.com/",
    scopes: ["sellingpartnerapi::notifications"],
    environments: ["sandbox", "production"],
    nextAction: "Complete Amazon developer application and seller authorization",
    lastVerified: "Never",
    validationMessage: "Amazon requires seller account and developer registration.",
    supports: ["catalog", "inventory", "orders"],
  },
  {
    slug: "etsy",
    name: "Etsy",
    category: "marketplace",
    status: "OAUTH_AVAILABLE",
    accessType: "OAuth 2.0 PKCE",
    docsUrl: "https://developers.etsy.com/documentation/",
    developerUrl: "https://www.etsy.com/developers/register",
    scopes: ["shops_r", "listings_r", "listings_w", "transactions_r"],
    environments: ["production"],
    nextAction: "Authorize an Etsy shop with listing and transaction scopes",
    lastVerified: "Never",
    validationMessage: "No Etsy grant has been stored.",
    supports: ["listing creation", "inventory", "orders"],
  },
  {
    slug: "shopify",
    name: "Shopify",
    category: "marketplace",
    status: "OAUTH_AVAILABLE",
    accessType: "OAuth 2.0",
    docsUrl: "https://shopify.dev/docs/api",
    developerUrl: "https://partners.shopify.com/",
    scopes: ["read_products", "write_products", "read_inventory", "write_inventory"],
    environments: ["development", "production"],
    nextAction: "Connect a store-owned custom app",
    lastVerified: "Never",
    validationMessage: "A shop domain and approved app grant are required.",
    supports: ["listing creation", "inventory updates", "orders"],
  },
  {
    slug: "woocommerce",
    name: "WooCommerce",
    category: "marketplace",
    status: "API_KEY_AVAILABLE",
    accessType: "REST consumer key and secret",
    docsUrl: "https://woocommerce.github.io/woocommerce-rest-api-docs/",
    developerUrl: "https://woocommerce.com/document/woocommerce-rest-api/",
    scopes: ["read/write products", "read/write orders"],
    environments: ["development", "production"],
    nextAction: "Add a store URL and scoped REST keys",
    lastVerified: "Never",
    validationMessage: "No WooCommerce keys have been stored.",
    supports: ["listing creation", "inventory updates", "orders"],
  },
  {
    slug: "walmart-marketplace",
    name: "Walmart Marketplace",
    category: "marketplace",
    status: "PARTNER_ACCESS_REQUIRED",
    accessType: "Developer portal key",
    docsUrl: "https://developer.walmart.com/",
    developerUrl: "https://developer.walmart.com/#/home",
    scopes: ["items", "inventory", "orders"],
    environments: ["sandbox", "production"],
    nextAction: "Confirm seller approval and obtain marketplace credentials",
    lastVerified: "Never",
    validationMessage: "Walmart Marketplace access is seller-account gated.",
    supports: ["catalog", "inventory", "orders"],
  },
  {
    slug: "google-merchant-center",
    name: "Google Merchant Center",
    category: "marketplace",
    status: "OAUTH_AVAILABLE",
    accessType: "OAuth 2.0",
    docsUrl: "https://developers.google.com/merchant/api",
    developerUrl: "https://console.cloud.google.com/",
    scopes: ["https://www.googleapis.com/auth/content"],
    environments: ["sandbox", "production"],
    nextAction: "Authorize the Merchant Center account",
    lastVerified: "Never",
    validationMessage: "Merchant account consent is required.",
    supports: ["product feeds", "offers"],
  },
  {
    slug: "meta-pages-instagram",
    name: "Meta Pages / Instagram Professional",
    category: "social",
    status: "OAUTH_AVAILABLE",
    accessType: "OAuth 2.0",
    docsUrl: "https://developers.facebook.com/docs/graph-api/",
    developerUrl: "https://developers.facebook.com/apps/",
    scopes: ["pages_manage_posts", "pages_read_engagement", "instagram_content_publish"],
    environments: ["development", "production"],
    nextAction: "Authorize an eligible Page and Instagram Professional account",
    lastVerified: "Never",
    validationMessage: "Personal profiles are not supported for automation.",
    supports: ["page publishing", "Instagram publishing", "insights"],
  },
  {
    slug: "tiktok",
    name: "TikTok",
    category: "social",
    status: "ACCESS_GATED",
    accessType: "TikTok developer application",
    docsUrl: "https://developers.tiktok.com/doc/overview/",
    developerUrl: "https://developers.tiktok.com/",
    scopes: ["video.publish", "user.info.basic"],
    environments: ["production"],
    nextAction: "Apply for approved Content Posting API access",
    lastVerified: "Never",
    validationMessage: "Content Posting access is reviewed by TikTok.",
    supports: ["video publishing"],
  },
  {
    slug: "youtube",
    name: "YouTube",
    category: "social",
    status: "OAUTH_AVAILABLE",
    accessType: "OAuth 2.0",
    docsUrl: "https://developers.google.com/youtube/v3",
    developerUrl: "https://console.cloud.google.com/",
    scopes: ["https://www.googleapis.com/auth/youtube.upload"],
    environments: ["sandbox", "production"],
    nextAction: "Authorize the channel for upload and metadata access",
    lastVerified: "Never",
    validationMessage: "No channel authorization has been stored.",
    supports: ["video publishing", "channel analytics"],
  },
  {
    slug: "pinterest",
    name: "Pinterest",
    category: "social",
    status: "OAUTH_AVAILABLE",
    accessType: "OAuth 2.0",
    docsUrl: "https://developers.pinterest.com/docs/",
    developerUrl: "https://developers.pinterest.com/apps/",
    scopes: ["boards:read", "pins:read", "pins:write"],
    environments: ["production"],
    nextAction: "Authorize a business account and selected boards",
    lastVerified: "Never",
    validationMessage: "Business account authorization is required.",
    supports: ["pin publishing", "catalogs"],
  },
  {
    slug: "abebooks",
    name: "AbeBooks",
    category: "books",
    status: "MANUAL_GUIDED",
    accessType: "UIEE / seller file workflow",
    docsUrl: "https://www.abebooks.com/booksellers/",
    developerUrl: "https://www.abebooks.com/booksellers/",
    scopes: [],
    environments: ["production"],
    nextAction: "Follow the seller file-upload checklist",
    lastVerified: "Never",
    validationMessage: "No public listing API was verified for this operation.",
    supports: ["guided inventory upload"],
  },
  {
    slug: "google-books",
    name: "Google Books",
    category: "book-data",
    status: "IMPLEMENTED_AUTOMATIC",
    accessType: "Public API key",
    docsUrl: "https://developers.google.com/books",
    developerUrl: "https://console.cloud.google.com/",
    scopes: [],
    environments: ["development", "production"],
    nextAction: "Optional: add a project API key for higher quotas",
    lastVerified: "Never",
    validationMessage: "Public ISBN lookups can run without a stored secret.",
    supports: ["ISBN lookup", "book metadata"],
  },
  {
    slug: "open-library",
    name: "Open Library",
    category: "book-data",
    status: "IMPLEMENTED_AUTOMATIC",
    accessType: "Public API",
    docsUrl: "https://openlibrary.org/developers/api",
    developerUrl: "https://openlibrary.org/developers/api",
    scopes: [],
    environments: ["development", "production"],
    nextAction: "No credential required for standard lookups",
    lastVerified: "Never",
    validationMessage: "Public metadata endpoint; observe its rate limits.",
    supports: ["ISBN lookup", "book metadata", "covers"],
  },
  {
    slug: "cardtrader",
    name: "CardTrader",
    category: "cards",
    status: "ACCESS_GATED",
    accessType: "Partner access",
    docsUrl: "https://www.cardtrader.com/docs",
    developerUrl: "https://www.cardtrader.com/",
    scopes: ["inventory", "orders"],
    environments: ["production"],
    nextAction: "Request approved developer access",
    lastVerified: "Never",
    validationMessage: "Closed program onboarding must be approved by the provider.",
    supports: ["inventory", "orders"],
  },
  {
    slug: "pricecharting",
    name: "PriceCharting",
    category: "cards",
    status: "API_KEY_AVAILABLE",
    accessType: "Provider API key",
    docsUrl: "https://www.pricecharting.com/api-documentation",
    developerUrl: "https://www.pricecharting.com/api",
    scopes: ["price lookup"],
    environments: ["production"],
    nextAction: "Add an authorized API key if your plan includes API access",
    lastVerified: "Never",
    validationMessage: "Market data is unavailable until an authorized plan is connected.",
    supports: ["catalog lookup", "price lookup"],
  },
  {
    slug: "psa",
    name: "PSA Certification",
    category: "cards",
    status: "MANUAL_GUIDED",
    accessType: "Official verification page",
    docsUrl: "https://www.psacard.com/cert",
    developerUrl: "https://www.psacard.com/",
    scopes: [],
    environments: ["production"],
    nextAction: "Verify certification numbers through the official page",
    lastVerified: "Never",
    validationMessage: "No public verification API was verified; no scraping is used.",
    supports: ["certification verification"],
  },
];

let workflows: Workflow[] = [
  {
    id: "wf-ebay-authorize",
    providerSlug: "ebay",
    action: "Authorize seller inventory access",
    state: "NEEDS_AUTHORIZATION",
    progress: 42,
    checkpoint: "Waiting for seller consent",
    updatedAt: now,
    nextAction: "Review provider, project, account, scopes, and environment before approval",
  },
  {
    id: "wf-bosslister-discovery",
    providerSlug: "github",
    action: "Inspect BossLister integration surface",
    state: "COMPLETED",
    progress: 100,
    checkpoint: "Manifest generated",
    updatedAt: now,
    nextAction: null,
  },
  {
    id: "wf-google-books",
    providerSlug: "google-books",
    action: "Validate ISBN metadata lookup",
    state: "FAILED_RETRYABLE",
    progress: 68,
    checkpoint: "Provider request can be retried",
    updatedAt: now,
    nextAction: "Retry with rate-limit backoff",
  },
];

let inventory: InventoryItem[] = [
  {
    id: "book-001",
    category: "books",
    title: "The Art of Computer Programming, Vol. 1",
    sku: "BK-TAOCP-001",
    quantity: 1,
    price: 82,
    cost: 22,
    status: "READY_FOR_REVIEW",
    metadata: { isbn13: "9780201896831", condition: "Very Good", signed: false },
  },
  {
    id: "card-001",
    category: "cards",
    title: "2024 Prizm Rookie Parallel",
    sku: "CD-PRIZM-024",
    quantity: 1,
    price: 145,
    cost: 40,
    status: "NEEDS_VERIFICATION",
    metadata: { sport: "Basketball", grade: "Raw", serialNumber: "078/299" },
  },
  {
    id: "merch-001",
    category: "merchandise",
    title: "BossLister Collector Tee",
    sku: "GM-TEE-BLK-M",
    quantity: 12,
    price: 28,
    cost: 9,
    status: "DRAFT",
    metadata: { size: "M", channels: ["shopify", "woocommerce"] },
  },
];

const router: IRouter = Router();

router.get("/bosskey/overview", (_req, res) => {
  const data = GetBossKeyOverviewResponse.parse({
    readinessScore: 58,
    missingConnections: 11,
    expiringTokens: 0,
    failedValidations: 1,
    pausedWorkflows: workflows.filter((workflow) => workflow.state !== "COMPLETED").length,
    inventoryConflicts: 1,
    securityAlerts: 0,
    discoveredAt: now,
  });
  res.json(data);
});

router.post("/bosskey/discover", (req, res) => {
  const input = DiscoverBossListerBody.parse(req.body ?? {});
  const data = DiscoverBossListerResponse.parse({
    projectName: "BossLister",
    repository: input.repository ?? "mjardin17/boss-listers-mvp",
    branch: input.branch ?? "codex/integrate-hot-wheels",
    providersFound: 18,
    environmentIssues: 2,
    backupCreated: true,
    manifestPath: "provider-manifest.json",
    completedAt: now,
  });
  req.log.info({ providerCount: data.providersFound }, "BossLister discovery completed");
  res.json(data);
});

router.get("/bosskey/providers", (req, res) => {
  const query = ListBossKeyProvidersQueryParams.parse(req.query);
  const search = query.search?.toLowerCase();
  const data = providers.filter((provider) => {
    const matchesCategory = !query.category || provider.category === query.category;
    const matchesStatus = !query.status || provider.status === query.status;
    const matchesSearch =
      !search ||
      `${provider.name} ${provider.category} ${provider.status}`.toLowerCase().includes(search);
    return matchesCategory && matchesStatus && matchesSearch;
  });
  res.json(ListBossKeyProvidersResponse.parse(data));
});

router.get("/bosskey/providers/:slug", (req, res) => {
  const { slug } = GetBossKeyProviderParams.parse(req.params);
  const provider = providers.find((item) => item.slug === slug);
  if (!provider) {
    res.status(404).json({ error: "Provider not found" });
    return;
  }
  res.json(GetBossKeyProviderResponse.parse(provider));
});

router.post("/bosskey/providers/:slug", (req, res) => {
  const { slug } = GetBossKeyProviderParams.parse(req.params);
  const provider = providers.find((item) => item.slug === slug);
  if (!provider) {
    res.status(404).json({ error: "Provider not found" });
    return;
  }
  const status = provider.status === "IMPLEMENTED_AUTOMATIC" ? "READY" : "NEEDS_AUTHORIZATION";
  res.json(
    ValidateBossKeyProviderResponse.parse({
      providerSlug: slug,
      status,
      message:
        status === "READY"
          ? "Public provider endpoint is available without a stored credential."
          : provider.validationMessage ?? provider.nextAction,
      checkedAt: now,
    }),
  );
});

router.get("/bosskey/vault/status", (_req, res) => {
  res.json(
    GetBossKeyVaultStatusResponse.parse({
      state: "LOCKED",
      credentialCount: 0,
      environmentCount: 3,
      autoLockMinutes: 15,
      telemetryEnabled: false,
      lastUnlockedAt: null,
    }),
  );
});

router.post("/bosskey/vault/lock", (_req, res) => {
  res.json(
    LockBossKeyVaultResponse.parse({
      state: "LOCKED",
      credentialCount: 0,
      environmentCount: 3,
      autoLockMinutes: 15,
      telemetryEnabled: false,
      lastUnlockedAt: null,
    }),
  );
});

router.get("/bosskey/workflows", (_req, res) => {
  res.json(ListBossKeyWorkflowsResponse.parse(workflows));
});

router.post("/bosskey/workflows/:workflowId/resume", (req, res) => {
  const { workflowId } = ResumeBossKeyWorkflowParams.parse(req.params);
  const workflow = workflows.find((item) => item.id === workflowId);
  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }
  workflow.state = "RUNNING";
  workflow.progress = Math.min(workflow.progress + 8, 96);
  workflow.updatedAt = new Date().toISOString();
  workflow.nextAction = "The next checkpoint is ready for explicit approval";
  res.json(ResumeBossKeyWorkflowResponse.parse(workflow));
});

router.get("/bosskey/inventory", (req, res) => {
  const query = ListBossKeyInventoryQueryParams.parse(req.query);
  const data = query.category
    ? inventory.filter((item) => item.category === query.category)
    : inventory;
  res.json(ListBossKeyInventoryResponse.parse(data));
});

router.post("/bosskey/inventory", (req, res) => {
  const input = CreateBossKeyInventoryItemBody.parse(req.body);
  const item: InventoryItem = {
    id: `item-${Date.now()}`,
    category: input.category,
    title: input.title,
    sku: input.sku,
    quantity: input.quantity,
    price: input.price,
    cost: input.cost,
    status: "DRAFT",
    metadata: input.metadata,
  };
  inventory = [item, ...inventory];
  res.status(201).json(CreateBossKeyInventoryItemResponse.parse(item));
});

router.patch("/bosskey/inventory/:itemId", (req, res) => {
  const { itemId } = UpdateBossKeyInventoryItemParams.parse(req.params);
  const input = UpdateBossKeyInventoryItemBody.parse(req.body);
  const item = inventory.find((candidate) => candidate.id === itemId);
  if (!item) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }
  Object.assign(item, input);
  res.json(UpdateBossKeyInventoryItemResponse.parse(item));
});

export default router;