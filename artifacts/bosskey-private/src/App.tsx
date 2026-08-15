import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Cloud,
  Code2,
  Command,
  ExternalLink,
  Fingerprint,
  GitBranch,
  Globe2,
  HardDrive,
  KeyRound,
  Layers3,
  LockKeyhole,
  Menu,
  Package,
  Play,
  Plus,
  RefreshCw,
  Search,
  ServerCog,
  Settings2,
  Shield,
  ShieldAlert,
  Sparkles,
  Tag,
  TerminalSquare,
  UnlockKeyhole,
  X,
  Zap,
} from 'lucide-react';
import {
  getGetBossKeyOverviewQueryKey,
  getGetBossKeyProviderQueryKey,
  getGetBossKeyVaultStatusQueryKey,
  getListBossKeyInventoryQueryKey,
  getListBossKeyProvidersQueryKey,
  getListBossKeyWorkflowsQueryKey,
  getHealthCheckQueryKey,
  useCreateBossKeyInventoryItem,
  useDiscoverBossLister,
  useGetBossKeyOverview,
  useGetBossKeyProvider,
  useGetBossKeyVaultStatus,
  useHealthCheck,
  useListBossKeyInventory,
  useListBossKeyProviders,
  useListBossKeyWorkflows,
  useLockBossKeyVault,
  useResumeBossKeyWorkflow,
  useUpdateBossKeyInventoryItem,
  useValidateBossKeyProvider,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { isLocalVaultUnlocked, lockLocalVault, unlockLocalVault } from '@/lib/vault-crypto';
import NotFound from '@/pages/not-found';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';

const queryClient = new QueryClient();

const navItems = [
  { href: '/', label: 'Command room', icon: Command, end: true },
  { href: '/providers', label: 'Providers', icon: Globe2 },
  { href: '/vault', label: 'Private vault', icon: LockKeyhole },
  { href: '/books', label: 'Books', icon: BookOpen },
  { href: '/cards', label: 'Cards', icon: Layers3 },
  { href: '/merchandise', label: 'Merchandise', icon: Package },
  { href: '/social', label: 'Social channels', icon: Zap },
  { href: '/workflows', label: 'Workflows', icon: Activity },
];

function cx(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(' ');
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function statusKind(value?: string) {
  const normalized = (value ?? '').toLowerCase();
  if (['connected', 'authorized', 'ready', 'validated', 'healthy', 'complete', 'completed', 'unlocked', 'active'].some((item) => normalized.includes(item))) return 'good';
  if (['paused', 'pending', 'attention', 'expiring', 'review', 'partial', 'draft', 'locked'].some((item) => normalized.includes(item))) return 'warn';
  if (['failed', 'blocked', 'missing', 'error', 'conflict'].some((item) => normalized.includes(item))) return 'bad';
  return 'neutral';
}

function StatusBadge({ value, label }: { value?: string; label?: string }) {
  const kind = statusKind(value);
  return (
    <span data-testid={`status-${(value ?? label ?? 'unknown').toLowerCase().replace(/\s+/g, '-')}`} className={cx('bk-status', `bk-status-${kind}`)}>
      <span className="bk-status-dot" />
      {label ?? value ?? 'Unknown'}
    </span>
  );
}

function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
  className,
  testId,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'quiet' | 'outline' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  testId: string;
}) {
  return (
    <button data-testid={testId} type={type} onClick={onClick} disabled={disabled} className={cx('bk-button', `bk-button-${variant}`, className)}>
      {children}
    </button>
  );
}

function Panel({ children, className, testId }: { children: ReactNode; className?: string; testId?: string }) {
  return <section data-testid={testId} className={cx('bk-card rounded-2xl', className)}>{children}</section>;
}

function PageHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {eyebrow}
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </header>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cx('bk-skeleton rounded-lg', className)} />;
}

function QueryState({ loading, error, onRetry, children }: { loading?: boolean; error?: boolean; onRetry?: () => void; children: ReactNode }) {
  if (loading) return <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-3/4" /></div>;
  if (error) {
    return (
      <div data-testid="state-query-error" className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <ShieldAlert className="mb-3 h-6 w-6 text-destructive" />
        <p className="text-sm font-semibold text-foreground">The control plane did not answer.</p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">Nothing was changed. Retry the read when the local API is available.</p>
        {onRetry && <Button testId="button-retry-query" variant="outline" onClick={onRetry} className="mt-4"><RefreshCw className="h-3.5 w-3.5" /> Retry read</Button>}
      </div>
    );
  }
  return children;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const active = navItems.find((item) => item.end ? location === item.href : location.startsWith(item.href));
  return (
    <div className="bk-noise min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-sidebar-border bg-sidebar/95 px-4 py-5 backdrop-blur-xl md:flex md:flex-col">
        <Link href="/" data-testid="link-brand" className="mb-9 flex items-center gap-3 px-2">
          <span className="brand-mark"><Shield className="h-5 w-5" /></span>
          <span><span className="block font-display text-lg font-semibold tracking-tight">BossKey</span><span className="bk-mono block text-[9px] uppercase tracking-[.2em] text-muted-foreground">private / local</span></span>
        </Link>
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Operate</p>
        <nav className="space-y-1" aria-label="Primary navigation">
          {navItems.slice(0, 3).map((item) => <NavItem key={item.href} item={item} active={active?.href === item.href} />)}
        </nav>
        <p className="mb-3 mt-7 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Inventory & reach</p>
        <nav className="space-y-1">
          {navItems.slice(3).map((item) => <NavItem key={item.href} item={item} active={active?.href === item.href} />)}
        </nav>
        <div className="mt-auto rounded-xl border border-sidebar-border bg-secondary/40 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold"><span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_0_4px_hsl(181_74%_63%_/_0.12)]" /> Local session</div>
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Credentials stay on this machine. Telemetry is a choice.</p>
          <Link href="/vault" data-testid="link-sidebar-vault" className="mt-3 flex items-center justify-between text-xs font-semibold text-primary hover:text-accent">Inspect vault <ChevronRight className="h-3.5 w-3.5" /></Link>
        </div>
      </aside>
      <div className="md:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-border/80 bg-background/88 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <button data-testid="button-toggle-mobile-menu" onClick={() => setMobileMenu(!mobileMenu)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"><Menu className="h-5 w-5" /></button>
            <div className="md:hidden"><span className="font-display text-lg font-semibold">BossKey</span><span className="ml-2 bk-mono text-[9px] uppercase tracking-widest text-muted-foreground">private</span></div>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex"><TerminalSquare className="h-3.5 w-3.5 text-accent" /> local control plane <span className="text-border">/</span> <span className="text-foreground">{active?.label ?? 'Command room'}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> private session</span>
            <Link href="/vault" data-testid="link-header-vault" className="rounded-lg border border-border bg-secondary/40 p-2 text-muted-foreground transition hover:border-primary/50 hover:text-primary"><KeyRound className="h-4 w-4" /></Link>
          </div>
        </header>
        {mobileMenu && <div className="fixed inset-x-0 top-[68px] z-40 border-b border-border bg-sidebar px-4 py-3 shadow-xl md:hidden">{navItems.map((item) => <NavItem key={item.href} item={item} active={active?.href === item.href} onNavigate={() => setMobileMenu(false)} />)}</div>}
        <main className="bk-main min-h-[calc(100dvh-68px)] px-4 py-7 sm:px-7 lg:px-10">{children}</main>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-sidebar/95 px-2 py-2 backdrop-blur-xl md:hidden">{navItems.slice(0, 5).map((item) => <Link key={item.href} href={item.href} data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`} className={cx('flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[9px] font-semibold', active?.href === item.href ? 'text-primary' : 'text-muted-foreground')}><item.icon className="h-4 w-4" />{item.label.split(' ')[0]}</Link>)}</div>
    </div>
  );
}

function NavItem({ item, active, onNavigate }: { item: typeof navItems[number]; active: boolean; onNavigate?: () => void }) {
  return <Link href={item.href} onClick={onNavigate} data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`} className={cx('group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition', active ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}><item.icon className={cx('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground group-hover:text-accent')} />{item.label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}</Link>;
}

function Metric({ label, value, detail, tone = 'default', icon: Icon }: { label: string; value: string | number; detail: string; tone?: 'default' | 'good' | 'warn' | 'bad'; icon: typeof Activity }) {
  return <div data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`} className="bk-card rounded-2xl p-4"><div className="flex items-center justify-between text-muted-foreground"><span className="text-[11px] font-bold uppercase tracking-[.14em]">{label}</span><Icon className={cx('h-4 w-4', tone === 'good' ? 'text-accent' : tone === 'warn' ? 'text-primary' : tone === 'bad' ? 'text-destructive' : 'text-muted-foreground')} /></div><div className={cx('mt-4 text-3xl font-semibold tracking-tight', tone === 'good' ? 'text-accent' : tone === 'warn' ? 'text-primary' : tone === 'bad' ? 'text-destructive' : 'text-foreground')}>{value}</div><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}

function Dashboard() {
  const overview = useGetBossKeyOverview({ query: { queryKey: getGetBossKeyOverviewQueryKey() } });
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const vault = useGetBossKeyVaultStatus({ query: { queryKey: getGetBossKeyVaultStatusQueryKey() } });
  const providers = useListBossKeyProviders({}, { query: { queryKey: getListBossKeyProvidersQueryKey({}) } });
  const workflows = useListBossKeyWorkflows({ query: { queryKey: getListBossKeyWorkflowsQueryKey() } });
  const inventory = useListBossKeyInventory({}, { query: { queryKey: getListBossKeyInventoryQueryKey({}) } });
  const discover = useDiscoverBossLister();
  const [discovery, setDiscovery] = useState<{ projectName?: string; providersFound?: number; environmentIssues?: number; manifestPath?: string } | null>(null);
  const data = overview.data;
  const ready = data?.readinessScore ?? 0;
  const activeWorkflows = (workflows.data ?? []).filter((workflow) => !['complete', 'completed'].includes(workflow.state.toLowerCase())).slice(0, 3);
  const providerList = (providers.data ?? []).slice(0, 4);
  const runDiscovery = () => discover.mutate({ data: { projectPath: '.', branch: 'main' } }, { onSuccess: (result) => setDiscovery(result) });
  return <div className="bk-page mx-auto max-w-[1440px]">
    <PageHeader eyebrow="Command room / 01" title="Readiness, without guesswork." description="A private operating view of BossLister access, inventory and publishing posture. No credential values are shown here.">
      <Button testId="button-run-discovery" onClick={runDiscovery} disabled={discover.isPending} variant="outline"><Sparkles className="h-4 w-4" />{discover.isPending ? 'Scanning local project' : 'Discover BossLister'}</Button>
    </PageHeader>
    <div className="mb-6 flex items-center gap-3 text-xs text-muted-foreground"><span className={cx('h-2 w-2 rounded-full', health.data?.status === 'ok' ? 'bg-accent' : 'bg-primary')} /><span data-testid="status-health">API {health.data?.status === 'ok' ? 'healthy' : health.isLoading ? 'checking' : health.data?.status ?? 'unavailable'}</span><span className="text-border">·</span><span>Last discovery {formatDate(data?.discoveredAt)}</span></div>
    <QueryState loading={overview.isLoading} error={overview.isError} onRetry={() => overview.refetch()}>
      <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <Panel className="bk-scanline relative overflow-hidden p-5 sm:p-7" testId="panel-readiness">
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
            <div><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-accent"><Shield className="h-4 w-4" /> System posture</div><h2 className="max-w-md font-display text-2xl leading-tight sm:text-3xl">Your channels are only as ready as your least honest connection.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">BossKey separates discovered, authorized and validated. The difference is the point.</p></div>
            <div className="readiness-ring" style={{ '--readiness': `${ready * 3.6}deg` } as CSSProperties}><div className="readiness-ring-inner"><span data-testid="value-readiness-score" className="text-4xl font-semibold">{ready}</span><span className="bk-mono text-[9px] uppercase tracking-widest text-muted-foreground">ready</span></div></div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4"><MiniStat label="Connections" value={data?.missingConnections ?? 0} suffix="missing" /><MiniStat label="Tokens" value={data?.expiringTokens ?? 0} suffix="expiring" /><MiniStat label="Validations" value={data?.failedValidations ?? 0} suffix="failed" /><MiniStat label="Conflicts" value={data?.inventoryConflicts ?? 0} suffix="inventory" /></div>
        </Panel>
        <Panel className="p-5" testId="panel-vault-summary"><div className="flex items-center justify-between"><span className="eyebrow-label">Private vault</span><Link href="/vault" data-testid="link-open-vault" className="text-muted-foreground hover:text-primary"><ArrowUpRight className="h-4 w-4" /></Link></div><div className="mt-6 flex items-center gap-3"><span className={cx('vault-glyph', vault.data?.state?.toLowerCase() === 'unlocked' ? 'vault-glyph-open' : '')}>{vault.data?.state?.toLowerCase() === 'unlocked' ? <UnlockKeyhole className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}</span><div><p data-testid="text-vault-state" className="font-semibold">{vault.data?.state ?? 'Checking vault'}</p><p className="text-xs text-muted-foreground">{vault.data ? `${vault.data.credentialCount} credentials · ${vault.data.environmentCount} environments` : 'Reading local metadata'}</p></div></div><div className="mt-7 flex items-end justify-between"><div><p className="bk-mono text-[10px] uppercase tracking-widest text-muted-foreground">Auto-lock</p><p className="mt-1 text-lg font-semibold">{vault.data?.autoLockMinutes ?? '—'} <span className="text-xs font-normal text-muted-foreground">minutes</span></p></div><StatusBadge value={vault.data?.telemetryEnabled ? 'Telemetry on' : 'Telemetry off'} /></div></Panel>
      </div>
    </QueryState>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Providers" value={providers.data?.length ?? '—'} detail="registry records discovered" tone="good" icon={Globe2} /><Metric label="Workflows" value={data?.pausedWorkflows ?? '—'} detail="paused and resumable" tone={data?.pausedWorkflows ? 'warn' : 'default'} icon={Activity} /><Metric label="Inventory" value={inventory.data?.length ?? '—'} detail="canonical items tracked" icon={Boxes} /><Metric label="Security alerts" value={data?.securityAlerts ?? '—'} detail="review before publishing" tone={data?.securityAlerts ? 'bad' : 'good'} icon={ShieldAlert} /></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <Panel className="p-5 sm:p-6" testId="panel-workflows-preview"><div className="mb-5 flex items-center justify-between"><div><span className="eyebrow-label">In motion</span><h2 className="mt-2 text-lg font-semibold">Resumable workflows</h2></div><Link href="/workflows" data-testid="link-view-workflows" className="text-xs font-semibold text-primary hover:text-accent">View all <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link></div><div className="space-y-3">{activeWorkflows.length ? activeWorkflows.map((workflow) => <WorkflowRow key={workflow.id} workflow={workflow} />) : <EmptyState icon={CircleDashed} title="No unfinished work" body="A quiet queue is a good queue. Start an authorization workflow from a provider detail." />}</div></Panel>
      <Panel className="p-5 sm:p-6" testId="panel-provider-watch"><div className="mb-5 flex items-center justify-between"><div><span className="eyebrow-label">Connection watch</span><h2 className="mt-2 text-lg font-semibold">Provider posture</h2></div><Link href="/providers" data-testid="link-view-providers" className="text-xs font-semibold text-primary hover:text-accent">Registry <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link></div><div className="space-y-1">{providerList.length ? providerList.map((provider) => <Link href={`/providers/${provider.slug}`} key={provider.slug} data-testid={`link-provider-${provider.slug}`} className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-secondary"><div className="flex items-center gap-3"><span className="provider-avatar">{provider.name.slice(0, 1)}</span><div><p className="text-sm font-semibold">{provider.name}</p><p className="text-xs text-muted-foreground">{provider.category}</p></div></div><StatusBadge value={provider.status} /></Link>) : <EmptyState icon={Globe2} title="No providers discovered" body="Run a local discovery pass to populate the registry." />}</div></Panel>
    </div>
    {discovery && <Modal title="Discovery completed" onClose={() => setDiscovery(null)} testId="modal-discovery"><div className="flex items-start gap-3 rounded-xl border border-accent/25 bg-accent/5 p-4"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><div><p className="text-sm font-semibold">{discovery.projectName ?? 'BossLister'} is mapped.</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Found {discovery.providersFound ?? 0} providers and {discovery.environmentIssues ?? 0} environment issues. Manifest: {discovery.manifestPath ?? 'local manifest'}.</p></div></div><Button testId="button-close-discovery" className="mt-5 w-full" onClick={() => setDiscovery(null)}>Continue to command room</Button></Modal>}
  </div>;
}

function MiniStat({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return <div><p className="bk-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value} <span className="text-[10px] font-normal text-muted-foreground">{suffix}</span></p></div>;
}

function WorkflowRow({ workflow }: { workflow: { id: string; providerSlug: string; action: string; state: string; progress: number; checkpoint: string; updatedAt: string; nextAction?: string | null } }) {
  return <Link href="/workflows" data-testid={`row-workflow-${workflow.id}`} className="block rounded-xl border border-border bg-secondary/30 p-3 transition hover:border-primary/35 hover:bg-secondary/55"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="h-2 w-2 shrink-0 rounded-full bg-primary" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{workflow.action}</p><p className="bk-mono mt-1 truncate text-[10px] uppercase tracking-wider text-muted-foreground">{workflow.providerSlug} · {workflow.checkpoint}</p></div></div><StatusBadge value={workflow.state} /></div><div className="mt-3 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${workflow.progress}%` }} /></div><span className="bk-mono text-[10px] text-muted-foreground">{workflow.progress}%</span></div></Link>;
}

function ProvidersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const query = useListBossKeyProviders({ search: search || undefined, status: status || undefined }, { query: { queryKey: getListBossKeyProvidersQueryKey({ search: search || undefined, status: status || undefined }) } });
  const providers = query.data ?? [];
  const statuses = Array.from(new Set(providers.map((provider) => provider.status))).filter(Boolean);
  return <div className="bk-page mx-auto max-w-[1240px]"><PageHeader eyebrow="Registry / 02" title="Provider registry" description="An honest index of what BossLister knows about, what is authorized, and what has passed a live validation."><Link href="/" data-testid="link-back-command" className="bk-button bk-button-quiet"><ArrowLeft className="h-4 w-4" /> Command room</Link></PageHeader>
    <Panel className="mb-4 p-3 sm:p-4" testId="panel-provider-filters"><div className="flex flex-col gap-3 md:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input data-testid="input-provider-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search provider, category or capability" className="bk-input pl-10" /></label><select data-testid="select-provider-status" value={status} onChange={(event) => setStatus(event.target.value)} className="bk-input md:w-52"><option value="">All access states</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></div></Panel>
    <QueryState loading={query.isLoading} error={query.isError} onRetry={() => query.refetch()}><div className="grid gap-3">{providers.length ? providers.map((provider) => <ProviderCard key={provider.slug} provider={provider} />) : <EmptyState icon={Search} title="No providers match that query" body="Try a broader term, or run discovery from the command room." />}</div></QueryState>
  </div>;
}

function ProviderCard({ provider }: { provider: { slug: string; name: string; category: string; status: string; accessType: string; scopes: string[]; environments: string[]; nextAction: string; lastVerified: string; validationMessage?: string | null; supports?: string[] } }) {
  return <Link href={`/providers/${provider.slug}`} data-testid={`card-provider-${provider.slug}`} className="bk-card group grid gap-5 rounded-2xl p-5 md:grid-cols-[1.4fr_1fr_.8fr] md:items-center"><div className="flex items-start gap-4"><span className="provider-avatar provider-avatar-lg">{provider.name.slice(0, 1)}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{provider.name}</h2><StatusBadge value={provider.status} /></div><p className="mt-1 text-xs text-muted-foreground">{provider.category} · {provider.accessType}</p><p className="mt-3 text-sm text-foreground/80">{provider.validationMessage ?? provider.nextAction ?? 'No next action recorded.'}</p></div></div><div className="grid grid-cols-2 gap-3 text-xs"><div><p className="eyebrow-label">Scopes</p><p className="mt-1 text-muted-foreground">{provider.scopes?.length ?? 0} declared</p></div><div><p className="eyebrow-label">Environments</p><p className="mt-1 text-muted-foreground">{provider.environments?.join(', ') || 'Not mapped'}</p></div></div><div className="flex items-center justify-between border-t border-border pt-4 text-xs md:block md:border-t-0 md:pt-0 md:text-right"><span className="text-muted-foreground">Checked {formatDate(provider.lastVerified)}</span><ArrowUpRight className="ml-2 inline h-4 w-4 text-primary transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div></Link>;
}

function ProviderDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? '';
  const query = useGetBossKeyProvider(slug, { query: { enabled: Boolean(slug), queryKey: getGetBossKeyProviderQueryKey(slug) } });
  const validate = useValidateBossKeyProvider();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const provider = query.data;
  const runValidation = () => validate.mutate({ slug }, { onSuccess: (value) => { setResult(value); queryClient.invalidateQueries({ queryKey: getGetBossKeyProviderQueryKey(slug) }); queryClient.invalidateQueries({ queryKey: getListBossKeyProvidersQueryKey() }); } });
  return <div className="bk-page mx-auto max-w-[1160px]"><Link href="/providers" data-testid="link-back-providers" className="mb-7 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Provider registry</Link><QueryState loading={query.isLoading} error={query.isError} onRetry={() => query.refetch()}>{provider && <><PageHeader eyebrow={`Provider / ${provider.category}`} title={provider.name} description={provider.validationMessage ?? provider.nextAction ?? 'Provider connection detail and validation state.'}><Button testId="button-validate-provider" onClick={runValidation} disabled={validate.isPending}><RefreshCw className={cx('h-4 w-4', validate.isPending && 'animate-spin')} /> {validate.isPending ? 'Validating' : 'Validate connection'}</Button></PageHeader><div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><Panel className="p-5 sm:p-7" testId="panel-provider-overview"><div className="flex flex-wrap items-center gap-3"><span className="provider-avatar provider-avatar-lg">{provider.name.slice(0, 1)}</span><div><p className="eyebrow-label">{provider.accessType}</p><div className="mt-1 flex items-center gap-3"><StatusBadge value={provider.status} /><span className="text-xs text-muted-foreground">Last verified {formatDate(provider.lastVerified)}</span></div></div></div><div className="mt-8 grid gap-6 sm:grid-cols-2"><DetailList title="Declared scopes" values={provider.scopes} icon={KeyRound} /><DetailList title="Environments" values={provider.environments} icon={ServerCog} /><DetailList title="Supports" values={provider.supports ?? []} icon={Sparkles} /><div><p className="eyebrow-label">Validation note</p><p data-testid="text-validation-message" className="mt-2 text-sm leading-6 text-muted-foreground">{provider.validationMessage ?? 'No validation has been recorded.'}</p></div></div></Panel><Panel className="p-5 sm:p-7" testId="panel-provider-links"><span className="eyebrow-label">Official surfaces</span><h2 className="mt-2 text-lg font-semibold">Go to the source</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">BossKey keeps links explicit so you always know where authorization happens.</p><div className="mt-6 space-y-2"><a data-testid="link-provider-docs" href={provider.docsUrl} target="_blank" rel="noreferrer" className="official-link"><BookOpen className="h-4 w-4 text-accent" /><span><b>Documentation</b><small>{provider.docsUrl}</small></span><ExternalLink className="ml-auto h-4 w-4" /></a><a data-testid="link-provider-developer" href={provider.developerUrl} target="_blank" rel="noreferrer" className="official-link"><Code2 className="h-4 w-4 text-primary" /><span><b>Developer console</b><small>{provider.developerUrl}</small></span><ExternalLink className="ml-auto h-4 w-4" /></a></div><div className="mt-7 border-t border-border pt-5"><p className="eyebrow-label">Next action</p><p data-testid="text-provider-next-action" className="mt-2 text-sm font-semibold text-primary">{provider.nextAction || 'No action needed.'}</p></div></Panel></div></>}</QueryState>{result && <Modal title="Validation result" onClose={() => setResult(null)} testId="modal-validation"><div className="flex items-start gap-3"><span className={cx('mt-0.5 rounded-full p-1.5', statusKind(result.status) === 'good' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary')}><Check className="h-4 w-4" /></span><div><p className="font-semibold">{result.status}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{result.message}</p></div></div><Button testId="button-close-validation" className="mt-5 w-full" onClick={() => setResult(null)}>Close</Button></Modal>}</div>;
}

function DetailList({ title, values, icon: Icon }: { title: string; values: string[]; icon: typeof KeyRound }) {
  return <div><p className="eyebrow-label">{title}</p>{values.length ? <div className="mt-2 flex flex-wrap gap-1.5">{values.map((value) => <span key={value} className="rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs text-foreground/80"><Icon className="mr-1 inline h-3 w-3 text-muted-foreground" />{value}</span>)}</div> : <p className="mt-2 text-sm text-muted-foreground">None declared</p>}</div>;
}

function VaultPage() {
  const query = useGetBossKeyVaultStatus({ query: { queryKey: getGetBossKeyVaultStatusQueryKey() } });
  const lock = useLockBossKeyVault();
  const queryClient = useQueryClient();
  const [unlockInfo, setUnlockInfo] = useState(false);
  const [localUnlocked, setLocalUnlocked] = useState(isLocalVaultUnlocked());
  const [masterPassword, setMasterPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const vault = query.data;
  const doLock = () => {
    lockLocalVault();
    setLocalUnlocked(false);
    lock.mutate(undefined, { onSuccess: (value) => queryClient.setQueryData(getGetBossKeyVaultStatusQueryKey(), value) });
  };
  const isUnlocked = localUnlocked || vault?.state?.toLowerCase() === 'unlocked';
  const doUnlock = async (event: FormEvent) => {
    event.preventDefault();
    setUnlocking(true);
    setUnlockError('');
    try {
      await unlockLocalVault(masterPassword);
      setLocalUnlocked(true);
      setMasterPassword('');
    } catch (error) {
      setUnlockError(error instanceof Error ? error.message : 'The local vault could not be unlocked.');
    } finally {
      setUnlocking(false);
    }
  };
  return <div className="bk-page mx-auto max-w-[1100px]"><PageHeader eyebrow="Vault / 03" title="The private vault" description="A local lock surface for credential metadata and runtime posture. Secret values never appear in BossKey screens."><Button testId="button-lock-vault" variant="outline" disabled={!isUnlocked || lock.isPending} onClick={doLock}><LockKeyhole className="h-4 w-4" /> {lock.isPending ? 'Locking' : 'Lock now'}</Button></PageHeader><QueryState loading={query.isLoading} error={query.isError} onRetry={() => query.refetch()}>{vault && <><Panel className={cx('vault-hero p-6 sm:p-8', isUnlocked && 'vault-hero-open')} testId="panel-vault-lock-surface"><div className="flex flex-col items-center text-center"><div className="vault-seal">{isUnlocked ? <UnlockKeyhole className="h-8 w-8" /> : <LockKeyhole className="h-8 w-8" />}</div><p className="eyebrow-label mt-6">{isUnlocked ? 'Local session active' : 'Vault is sealed'}</p><h2 data-testid="text-vault-lock-state" className="mt-2 font-display text-3xl">{isUnlocked ? 'UNLOCKED' : 'LOCKED'}</h2><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{isUnlocked ? 'The derived master key exists only in this browser session. Locking clears it from memory.' : 'Use the master password to unlock the local vault. The password never leaves this browser and is never sent to the API.'}</p>{isUnlocked ? <Button testId="button-vault-unlock-info" variant="quiet" onClick={() => setUnlockInfo(true)} className="mt-6">Review lock policy <ChevronRight className="h-4 w-4" /></Button> : <form onSubmit={doUnlock} className="mt-6 w-full max-w-sm text-left"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-foreground/80">Master password</span><input data-testid="input-master-password" type="password" autoComplete="current-password" minLength={12} required value={masterPassword} onChange={(event) => setMasterPassword(event.target.value)} placeholder="At least 12 characters" className="bk-input" /></label>{unlockError && <p data-testid="text-unlock-error" className="mt-2 text-xs text-destructive">{unlockError}</p>}<Button testId="button-unlock-vault" type="submit" disabled={unlocking} className="mt-4 w-full">{unlocking ? 'Deriving local key' : 'Unlock locally'} <UnlockKeyhole className="h-4 w-4" /></Button></form>}</div></Panel><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Credentials" value={vault.credentialCount} detail="metadata records only" icon={KeyRound} /><Metric label="Environments" value={vault.environmentCount} detail="local scopes mapped" icon={ServerCog} /><Metric label="Auto-lock" value={`${vault.autoLockMinutes}m`} detail="inactivity policy" tone="good" icon={LockKeyhole} /><Metric label="Telemetry" value={vault.telemetryEnabled ? 'On' : 'Off'} detail="operator-controlled" tone={vault.telemetryEnabled ? 'warn' : 'good'} icon={Activity} /></div><Panel className="mt-4 p-5 sm:p-6" testId="panel-vault-notes"><div className="flex items-start gap-3"><Fingerprint className="mt-0.5 h-5 w-5 text-accent" /><div><h2 className="font-semibold">What this surface guarantees</h2><ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-2"><li><Check className="mr-2 inline h-4 w-4 text-accent" />No raw secrets in dashboard payloads</li><li><Check className="mr-2 inline h-4 w-4 text-accent" />Explicit environment boundaries</li><li><Check className="mr-2 inline h-4 w-4 text-accent" />Lock action clears the in-memory key</li><li><Check className="mr-2 inline h-4 w-4 text-accent" />Telemetry posture is visible, not implied</li></ul><p className="mt-5 text-xs text-muted-foreground">Last unlocked {formatDate(vault.lastUnlockedAt)}</p></div></div></Panel></>}</QueryState>{unlockInfo && <Modal title="Unlock stays local" onClose={() => setUnlockInfo(false)} testId="modal-unlock-info"><div className="rounded-xl border border-primary/25 bg-primary/5 p-4"><div className="flex items-start gap-3"><HardDrive className="mt-0.5 h-5 w-5 text-primary" /><p className="text-sm leading-6 text-muted-foreground">The local vault uses Argon2id to derive a key and XChaCha20-Poly1305 to authenticate encrypted values. Only encrypted metadata remains in browser storage; the active key is cleared when you lock.</p></div></div><Button testId="button-close-unlock-info" className="mt-5 w-full" onClick={() => setUnlockInfo(false)}>Understood</Button></Modal>}</div>;
}

function InventoryPage({ category, title, eyebrow, description, icon: Icon }: { category: string; title: string; eyebrow: string; description: string; icon: typeof BookOpen }) {
  const query = useListBossKeyInventory({ category }, { query: { queryKey: getListBossKeyInventoryQueryKey({ category }) } });
  const create = useCreateBossKeyInventoryItem();
  const update = useUpdateBossKeyInventoryItem();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ title: '', sku: '', quantity: '1', price: '', cost: '', detailA: '', detailB: '' });
  const items = query.data ?? [];
  const detailLabels = category === 'books' ? ['Author', 'ISBN'] : category === 'cards' ? ['Set / edition', 'Verification'] : ['Brand', 'Channel mapping'];
  const addItem = (event: FormEvent) => {
    event.preventDefault();
    create.mutate({ data: { category, title: draft.title, sku: draft.sku, quantity: Number(draft.quantity), price: Number(draft.price), cost: Number(draft.cost), metadata: { [detailLabels[0].toLowerCase().replace(/\s+\/\s+|\s+/g, '_')]: draft.detailA, [detailLabels[1].toLowerCase().replace(/\s+\/\s+|\s+/g, '_')]: draft.detailB } } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListBossKeyInventoryQueryKey({ category }) }); setShowCreate(false); setDraft({ title: '', sku: '', quantity: '1', price: '', cost: '', detailA: '', detailB: '' }); } });
  };
  const toggleReady = (item: { id: string; status: string }) => update.mutate({ itemId: item.id, data: { status: item.status.toLowerCase().includes('ready') ? 'draft' : 'ready' } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBossKeyInventoryQueryKey({ category }) }) });
  return <div className="bk-page mx-auto max-w-[1240px]"><PageHeader eyebrow={eyebrow} title={title} description={description}><Button testId={`button-add-${category}`} onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add {category === 'merchandise' ? 'merchandise' : category.slice(0, -1)}</Button></PageHeader><div className="mb-5 flex items-center gap-3 text-xs text-muted-foreground"><Icon className="h-4 w-4 text-primary" /><span data-testid={`text-${category}-count`}>{items.length} canonical records</span><span className="text-border">·</span><span>Readiness follows required metadata, not optimism.</span></div><QueryState loading={query.isLoading} error={query.isError} onRetry={() => query.refetch()}>{items.length ? <Panel className="overflow-hidden" testId={`panel-${category}-inventory`}><div className="hidden grid-cols-[1.6fr_.8fr_.55fr_.65fr_.75fr_auto] gap-4 border-b border-border bg-secondary/30 px-5 py-3 text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground md:grid"><span>Item</span><span>SKU</span><span>Qty</span><span>Price</span><span>Readiness</span><span /></div><div className="divide-y divide-border">{items.map((item) => <InventoryRow key={item.id} item={item} onToggle={() => toggleReady(item)} pending={update.isPending} />)}</div></Panel> : <EmptyState icon={Icon} title={`No ${category} in the canonical inventory`} body="Add the first record with the metadata your publishing channels will need." actionLabel={`Add ${category === 'merchandise' ? 'merchandise' : category.slice(0, -1)}`} onAction={() => setShowCreate(true)} />}</QueryState>{showCreate && <Modal title={`Add ${category === 'merchandise' ? 'merchandise' : category.slice(0, -1)}`} onClose={() => setShowCreate(false)} testId={`modal-add-${category}`}><form onSubmit={addItem} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Title" value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} placeholder="A clear inventory title" testId={`input-${category}-title`} required /><Field label="SKU" value={draft.sku} onChange={(value) => setDraft({ ...draft, sku: value })} placeholder="BL-..." testId={`input-${category}-sku`} required /></div><div className="grid gap-4 sm:grid-cols-3"><Field label="Quantity" type="number" value={draft.quantity} onChange={(value) => setDraft({ ...draft, quantity: value })} testId={`input-${category}-quantity`} required /><Field label="List price" type="number" value={draft.price} onChange={(value) => setDraft({ ...draft, price: value })} placeholder="0.00" testId={`input-${category}-price`} required /><Field label="Cost basis" type="number" value={draft.cost} onChange={(value) => setDraft({ ...draft, cost: value })} placeholder="0.00" testId={`input-${category}-cost`} required /></div><div className="grid gap-4 sm:grid-cols-2"><Field label={detailLabels[0]} value={draft.detailA} onChange={(value) => setDraft({ ...draft, detailA: value })} testId={`input-${category}-detail-a`} /><Field label={detailLabels[1]} value={draft.detailB} onChange={(value) => setDraft({ ...draft, detailB: value })} testId={`input-${category}-detail-b`} /></div><Button type="submit" testId={`button-submit-${category}`} disabled={create.isPending} className="w-full">{create.isPending ? 'Saving record' : 'Save canonical record'} <Check className="h-4 w-4" /></Button></form></Modal>}</div>;
}

function InventoryRow({ item, onToggle, pending }: { item: { id: string; title: string; sku: string; quantity: number; price: number; status: string; metadata?: Record<string, unknown> }; onToggle: () => void; pending: boolean }) {
  return <div data-testid={`row-inventory-${item.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-secondary/25 md:grid-cols-[1.6fr_.8fr_.55fr_.65fr_.75fr_auto] md:items-center md:gap-4"><div><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{Object.values(item.metadata ?? {}).filter(Boolean).slice(0, 2).join(' · ') || 'Metadata pending'}</p></div><span className="bk-mono text-[11px] text-muted-foreground">{item.sku}</span><span className="text-sm text-muted-foreground"><span className="md:hidden">Qty </span>{item.quantity}</span><span className="font-semibold text-primary">${item.price.toFixed(2)}</span><StatusBadge value={item.status} /><Button testId={`button-toggle-ready-${item.id}`} variant="quiet" disabled={pending} onClick={onToggle} className="justify-self-start text-xs md:justify-self-end">{item.status.toLowerCase().includes('ready') ? 'Set draft' : 'Mark ready'}</Button></div>;
}

function Field({ label, value, onChange, placeholder, type = 'text', testId, required }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; testId: string; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-foreground/80">{label}</span><input data-testid={testId} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="bk-input" /></label>;
}

function SocialPage() {
  const providers = useListBossKeyProviders({ category: 'social' }, { query: { queryKey: getListBossKeyProvidersQueryKey({ category: 'social' }) } });
  const channels = providers.data ?? [];
  return <div className="bk-page mx-auto max-w-[1180px]"><PageHeader eyebrow="Reach / 06" title="Social channels" description="Publishing surfaces are constrained by the access they actually have. This is a readiness board, not a promise board." /><QueryState loading={providers.isLoading} error={providers.isError} onRetry={() => providers.refetch()}>{channels.length ? <div className="grid gap-4 md:grid-cols-2">{channels.map((channel) => <Panel key={channel.slug} className="p-5" testId={`card-social-${channel.slug}`}><div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="provider-avatar"><Globe2 className="h-4 w-4" /></span><div><h2 className="font-semibold">{channel.name}</h2><p className="text-xs text-muted-foreground">{channel.accessType}</p></div></div><StatusBadge value={channel.status} /></div><div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4"><div><p className="eyebrow-label">Scopes</p><p className="mt-1 text-sm">{channel.scopes?.length ?? 0} declared</p></div><div><p className="eyebrow-label">Next action</p><p className="mt-1 text-sm text-primary">{channel.nextAction || 'Observe'}</p></div></div><Link href={`/providers/${channel.slug}`} data-testid={`link-social-provider-${channel.slug}`} className="mt-5 inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-primary">Inspect connection <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link></Panel>)}</div> : <EmptyState icon={Zap} title="No social channels discovered" body="Discovery will map social providers when they are present in the BossLister project." actionLabel="Run discovery" href="/" />}</QueryState><Panel className="mt-4 p-5 sm:p-6" testId="panel-social-constraints"><div className="flex items-start gap-3"><AlertTriangle className="h-5 w-5 text-primary" /><div><h2 className="font-semibold">Publishing guardrails</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">BossKey will not infer a publish capability from a login alone. A channel needs the right scopes, a valid environment and a passing validation before a workflow can move forward.</p></div></div></Panel></div>;
}

function WorkflowsPage() {
  const query = useListBossKeyWorkflows({ query: { queryKey: getListBossKeyWorkflowsQueryKey() } });
  const resume = useResumeBossKeyWorkflow();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const workflows = query.data ?? [];
  const doResume = (workflowId: string) => resume.mutate({ workflowId }, { onSuccess: () => { setSelected(null); queryClient.invalidateQueries({ queryKey: getListBossKeyWorkflowsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetBossKeyOverviewQueryKey() }); } });
  return <div className="bk-page mx-auto max-w-[1180px]"><PageHeader eyebrow="Operations / 07" title="Resumable workflows" description="Authorization and publishing work should survive an interrupted session. Pick up from the last known checkpoint, never from memory." /><QueryState loading={query.isLoading} error={query.isError} onRetry={() => query.refetch()}>{workflows.length ? <div className="space-y-3">{workflows.map((workflow) => <Panel key={workflow.id} className="p-5" testId={`card-workflow-${workflow.id}`}><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-4"><div className={cx('workflow-state-icon', statusKind(workflow.state) === 'good' ? 'text-accent' : 'text-primary')}><Activity className="h-5 w-5" /></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{workflow.action}</h2><StatusBadge value={workflow.state} /></div><p className="bk-mono mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{workflow.providerSlug} · {workflow.id}</p><p className="mt-3 text-sm text-foreground/80">Checkpoint: <span className="font-semibold">{workflow.checkpoint}</span></p><p className="mt-1 text-xs text-muted-foreground">Updated {formatDate(workflow.updatedAt)}{workflow.nextAction ? ` · Next: ${workflow.nextAction}` : ''}</p></div></div><div className="min-w-[260px] lg:max-w-xs"><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span className="bk-mono text-primary">{workflow.progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${workflow.progress}%` }} /></div><Button testId={`button-resume-workflow-${workflow.id}`} variant="outline" disabled={resume.isPending} onClick={() => setSelected(workflow.id)} className="mt-4 w-full"><Play className="h-3.5 w-3.5" /> Resume from checkpoint</Button></div></div></Panel>)}</div> : <EmptyState icon={Activity} title="No resumable workflows" body="When a provider action pauses, its checkpoint will remain here until you decide to continue." />}</QueryState>{selected && <Modal title="Resume workflow?" onClose={() => setSelected(null)} testId="modal-resume-workflow"><p className="text-sm leading-6 text-muted-foreground">BossKey will continue this workflow from its recorded checkpoint. No earlier steps will be repeated automatically.</p><div className="mt-5 flex gap-2"><Button testId="button-cancel-resume" variant="quiet" onClick={() => setSelected(null)} className="flex-1">Cancel</Button><Button testId="button-confirm-resume" onClick={() => doResume(selected)} className="flex-1" disabled={resume.isPending}>{resume.isPending ? 'Resuming' : 'Resume'} <Play className="h-4 w-4" /></Button></div></Modal>}</div>;
}

function Modal({ title, onClose, children, testId }: { title: string; onClose: () => void; children: ReactNode; testId: string }) {
  return <div data-testid={testId} className="fixed inset-0 z-50 flex items-end justify-center bg-background/75 p-4 backdrop-blur-sm sm:items-center"><div className="w-full max-w-md rounded-2xl border border-border bg-popover p-5 shadow-2xl sm:p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button data-testid={`button-close-${testId}`} onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" /></button></div>{children}</div></div>;
}

function EmptyState({ icon: Icon, title, body, actionLabel, onAction, href }: { icon: typeof Search; title: string; body: string; actionLabel?: string; onAction?: () => void; href?: string }) {
  return <div data-testid={`empty-${title.toLowerCase().replace(/\s+/g, '-')}`} className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/10 p-7 text-center"><span className="mb-4 rounded-xl border border-border bg-secondary/50 p-3 text-muted-foreground"><Icon className="h-5 w-5" /></span><h2 className="font-semibold">{title}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{body}</p>{actionLabel && (href ? <Link href={href} data-testid="link-empty-action" className="bk-button bk-button-outline mt-5">{actionLabel} <ArrowUpRight className="h-4 w-4" /></Link> : <Button testId="button-empty-action" variant="outline" onClick={onAction} className="mt-5">{actionLabel} <Plus className="h-4 w-4" /></Button>)}</div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Dashboard} /><Route path="/providers" component={ProvidersPage} /><Route path="/providers/:slug" component={ProviderDetailPage} /><Route path="/vault" component={VaultPage} /><Route path="/books">{() => <InventoryPage category="books" title="Book inventory" eyebrow="Inventory / 04" description="Bibliographic fields first, marketplace listing second. Keep edition and identity explicit." icon={BookOpen} />}</Route><Route path="/cards">{() => <InventoryPage category="cards" title="Cards inventory" eyebrow="Inventory / 05" description="Sports, trading and TCG stock with verification fields kept beside the commercial record." icon={Layers3} />}</Route><Route path="/merchandise">{() => <InventoryPage category="merchandise" title="Merchandise inventory" eyebrow="Inventory / 05" description="General goods with channel mapping close at hand, so a listing never outruns its destination." icon={Package} />}</Route><Route path="/social" component={SocialPage} /><Route path="/workflows" component={WorkflowsPage} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  useEffect(() => { document.documentElement.classList.add('dark'); return () => document.documentElement.classList.remove('dark'); }, []);
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Shell><Router /></Shell></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;