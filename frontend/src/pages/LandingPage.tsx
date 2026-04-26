/**
 * ============================================
 * LANDING PAGE — Onyx & Gold Edition (2026)
 * ============================================
 *
 * Fully dark, end-to-end onyx + champagne theme.
 * Six unique animated backdrops, one per section, all on black.
 */

import { Link } from 'react-router-dom';
import {
  CubeIcon,
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
  SparklesIcon,
  ArrowRightIcon,
  DevicePhoneMobileIcon,
  CurrencyRupeeIcon,
  TruckIcon,
  ScaleIcon,
  ClipboardDocumentCheckIcon,
  BellAlertIcon,
  DocumentChartBarIcon,
  IdentificationIcon,
  CheckBadgeIcon,
  PaintBrushIcon,
  PrinterIcon,
  FireIcon,
  WrenchScrewdriverIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import BrandMark from '../components/common/BrandMark';
import {
  AuroraDust,
  VelvetGlow,
  GoldThread,
  MoltenWaves,
  SpotlightGrain,
  EmberDrift,
} from '../components/common/LandingBackdrops';

const FEATURES = [
  { icon: CubeIcon, title: 'Order Management', body: 'Create, edit, and track orders end-to-end across all 9 production departments — from CAD design to final dispatch — with full audit history.' },
  { icon: ChartBarIcon, title: 'Factory Kanban', body: 'Drag-and-drop board for routing work between departments. See queue depth, bottlenecks, and worker load at a glance.' },
  { icon: UserGroupIcon, title: 'Workforce & Assignments', body: 'Assign jobs to department workers, manage availability, and capture submissions with photo evidence and quality checks.' },
  { icon: ScaleIcon, title: 'Metal & Diamond Inventory', body: 'Track gold, silver, platinum, palladium, diamonds and stones by lot — with melting batches, transfers, and full reconciliation.' },
  { icon: TruckIcon, title: 'Vendor Master + Live GST', body: 'Add vendors with one-click GSTIN auto-fill from a live GST API. Verified legal name, trade name, address, and jurisdiction.' },
  { icon: CurrencyRupeeIcon, title: 'Live Bullion Rates', body: 'Real-time Bangalore market rates for 22K, 24K, silver, platinum & palladium — auto-scraped and stored hourly.' },
  { icon: ClipboardDocumentCheckIcon, title: 'Quality Control', body: 'Department-specific work requirements, file uploads, photo documentation, and admin approval workflows at every step.' },
  { icon: BellAlertIcon, title: 'Real-time Notifications', body: 'Push, in-app, and worker mobile notifications keep every stakeholder informed about progress and exceptions.' },
  { icon: DocumentChartBarIcon, title: 'Reports & Analytics', body: 'Pending, overdue, financial, payroll, and attendance reports — exportable to Excel and PDF with one click.' },
  { icon: IdentificationIcon, title: 'Attendance & Payroll', body: 'Worker attendance, leave, advances, and monthly payroll with automatic deductions and slip generation.' },
  { icon: DevicePhoneMobileIcon, title: 'Client Portal', body: 'Clients can self-register, place orders, upload reference designs, track progress, and chat with the factory.' },
  { icon: ShieldCheckIcon, title: 'Enterprise Security', body: 'Role-based access (RBAC), JWT auth, audit log on every action, and field-level permission control.' },
];

const DEPARTMENTS = [
  { name: 'CAD Design', icon: PaintBrushIcon },
  { name: '3D Print', icon: PrinterIcon },
  { name: 'Casting', icon: FireIcon },
  { name: 'Filling', icon: WrenchScrewdriverIcon },
  { name: 'Meena Work', icon: SwatchIcon },
  { name: 'Polish 1', icon: SparklesIcon },
  { name: 'Stone Setting', icon: SparklesIcon },
  { name: 'Polish 2', icon: SparklesIcon },
  { name: 'Finishing Touch', icon: CheckBadgeIcon },
];

const STATS = [
  { value: '9', label: 'Production Departments' },
  { value: '50+', label: 'Modules' },
  { value: 'Live', label: 'GST + Bullion Rates' },
  { value: '24×7', label: 'Audit & Activity Log' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-onyx-900 text-pearl antialiased">
      {/* ────────────────  HEADER  ──────────────── */}
      <header className="sticky top-0 z-50 bg-onyx-900/80 backdrop-blur-xl border-b border-champagne-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-onyx-800 via-onyx-900 to-onyx-700 flex items-center justify-center shadow-lg ring-1 ring-champagne-300/30 group-hover:scale-105 transition">
              <BrandMark className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl sm:text-[1.7rem] font-semibold tracking-tight bg-gradient-to-r from-pearl via-champagne-200 to-champagne-400 bg-clip-text text-transparent">
              Ativa Jewels
            </h1>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <a href="#features" className="nav-link group relative px-3 py-2 text-sm text-pearl/70 hover:text-pearl transition">
              <span className="relative">Features
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-champagne-400 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
              </span>
            </a>
            <a href="#workflow" className="nav-link group relative px-3 py-2 text-sm text-pearl/70 hover:text-pearl transition">
              <span className="relative">Workflow
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-champagne-400 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
              </span>
            </a>
            <a href="#modules" className="nav-link group relative px-3 py-2 text-sm text-pearl/70 hover:text-pearl transition">
              <span className="relative">Modules
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-champagne-400 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
              </span>
            </a>
            <Link to="/client/login" className="group relative ml-2 px-3 py-2 text-sm text-pearl/80 hover:text-pearl transition">
              <span className="relative">Client Login
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-champagne-400 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
              </span>
            </Link>
            <Link
              to="/login"
              className="group relative ml-1 px-4 py-2 text-sm font-semibold text-onyx-900 bg-gradient-to-r from-champagne-300 via-champagne-400 to-champagne-600 rounded-lg shadow-sm overflow-hidden hover:shadow-[0_8px_24px_-8px_rgba(232,198,132,0.7)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="relative z-10">Staff Login</span>
              {/* sheen sweep */}
              <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out" />
            </Link>
          </nav>
          <Link
            to="/login"
            className="md:hidden px-3 py-1.5 text-xs font-semibold text-onyx-900 bg-champagne-400 rounded-lg"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ────────────────  HERO  ──────────────── */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
          <AuroraDust className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(11,11,12,0.55)_100%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-28 sm:pb-36">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-champagne-300/40 bg-onyx-800/60 backdrop-blur text-champagne-200 text-[11px] font-semibold tracking-[0.18em] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-champagne-300 animate-pulse" />
              Crafted for India's finest goldsmiths
            </div>

            <h1 className="mt-6 font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight">
              Where artisanship meets
              <br className="hidden sm:block" />{' '}
              <span className="bg-gradient-to-r from-champagne-200 via-champagne-300 to-champagne-500 bg-clip-text text-transparent">
                operational excellence.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-pearl/75 max-w-2xl mx-auto leading-relaxed">
              An end-to-end factory management platform for fine jewellery — orders,
              workforce, inventory, live bullion rates, GST verification, and a
              client portal, all in one luxurious workspace.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/client/register"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-champagne-300 via-champagne-400 to-champagne-600 text-onyx-900 font-semibold shadow-[0_10px_40px_-10px_rgba(232,198,132,0.6)] hover:from-champagne-200 hover:to-champagne-500 transition"
              >
                <UserGroupIcon className="w-5 h-5" />
                Register as Client
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-pearl/10 text-pearl border border-pearl/20 backdrop-blur hover:bg-pearl/20 transition font-semibold"
              >
                Staff Sign In
              </Link>
            </div>

            <dl className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <dt className="text-[10px] uppercase tracking-[0.15em] text-champagne-300/80 font-semibold">{s.label}</dt>
                  <dd className="mt-1 font-serif text-2xl sm:text-3xl text-pearl">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-champagne-400/60 to-transparent" />
      </section>

      {/* ────────────────  FEATURES (VelvetGlow)  ──────────────── */}
      <section id="features" className="relative overflow-hidden">
        <VelvetGlow className="absolute inset-0" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <SectionHeading
            eyebrow="Capabilities"
            title="Everything your factory needs, refined."
            subtitle="Twelve interlocking modules — built for jewellery, not retrofitted from a generic ERP."
          />

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="group relative rounded-2xl border border-champagne-500/15 bg-onyx-800/60 backdrop-blur-sm p-6 hover:border-champagne-400/50 hover:bg-onyx-800/85 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(245,225,181,0.18)] transition-all duration-500 overflow-hidden"
              >
                {/* hover sheen sweep */}
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute -inset-[100%] bg-[linear-gradient(115deg,transparent_40%,rgba(245,225,181,0.08)_50%,transparent_60%)] -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                </div>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champagne-400/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-onyx-700 to-onyx-900 border border-champagne-400/30 flex items-center justify-center text-champagne-300 group-hover:scale-110 group-hover:border-champagne-300/70 group-hover:text-champagne-200 group-hover:shadow-[0_0_20px_-2px_rgba(245,225,181,0.4)] transition-all duration-500">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="relative mt-4 font-serif text-xl font-semibold text-pearl group-hover:text-champagne-100 transition-colors duration-300">{title}</h3>
                <p className="relative mt-2 text-sm text-pearl/60 group-hover:text-pearl/80 leading-relaxed transition-colors duration-300">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────  9-DEPT FLOW (GoldThread)  ──────────────── */}
      <section id="workflow" className="relative overflow-hidden border-y border-champagne-500/10">
        <GoldThread className="absolute inset-0" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <SectionHeading
            eyebrow="Production Flow"
            title="Nine departments. One seamless pipeline."
            subtitle="Every order moves through this exact sequence — with full traceability at every stage."
          />

          <div className="mt-14 relative">
            <div className="hidden lg:block absolute left-0 right-0 top-9 h-px bg-gradient-to-r from-transparent via-champagne-400/60 to-transparent" />

            <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-4 lg:gap-3 relative">
              {DEPARTMENTS.map((d, i) => {
                const Icon = d.icon;
                return (
                  <li key={d.name} className="group flex flex-col items-center text-center">
                    <div className="relative">
                      <div className="h-[72px] w-[72px] rounded-2xl bg-onyx-800/80 backdrop-blur border border-champagne-400/25 shadow-lg flex items-center justify-center text-champagne-300 group-hover:bg-champagne-400 group-hover:text-onyx-900 group-hover:border-champagne-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_10px_30px_-5px_rgba(245,225,181,0.5)] transition-all duration-500 ease-out">
                        <Icon className="w-7 h-7 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-champagne-400 text-onyx-900 text-[11px] font-bold flex items-center justify-center shadow ring-2 ring-onyx-900 group-hover:ring-champagne-200 group-hover:scale-125 transition-all duration-500">
                        {i + 1}
                      </span>
                    </div>
                    <div className="mt-3 text-[10px] uppercase tracking-[0.12em] font-semibold text-champagne-400 group-hover:text-champagne-200 transition-colors">
                      Step {i + 1}
                    </div>
                    <div className="text-sm font-semibold text-pearl group-hover:text-champagne-100 transition-colors">{d.name}</div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* ────────────────  MODULES (MoltenWaves)  ──────────────── */}
      <section id="modules" className="relative overflow-hidden">
        <MoltenWaves className="absolute inset-0" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="inline-block px-3 py-1 text-[10px] uppercase tracking-[0.15em] font-semibold rounded-full bg-champagne-400/10 text-champagne-300 border border-champagne-400/30">
                Built for fine jewellery
              </span>
              <h2 className="mt-4 font-serif text-4xl sm:text-5xl font-semibold text-pearl leading-tight">
                A <span className="italic bg-gradient-to-r from-champagne-300 to-champagne-500 bg-clip-text text-transparent">bespoke</span> system —
                shaped around how your factory actually works.
              </h2>
              <p className="mt-5 text-lg text-pearl/70 leading-relaxed">
                From the moment a CAD file lands to the final stone-setting check,
                every artisan, file, gram, and rupee is captured, costed, and made
                visible to the people who need it — and only them.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  'Multi-tenant role-based access with field-level permissions',
                  'Live GSTIN verification + auto-filled vendor master',
                  'Per-worker payroll with leaves, advances, and slips',
                  'Hourly bullion rate sync (Bangalore market)',
                  'PWA-ready — works on factory floor tablets and phones',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3 text-sm text-pearl/80">
                    <CheckBadgeIcon className="h-5 w-5 text-champagne-400 flex-shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  to="/client/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-champagne-300 via-champagne-400 to-champagne-600 text-onyx-900 text-sm font-semibold hover:from-champagne-200 hover:to-champagne-500 transition shadow-lg"
                >
                  Get Started
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
                <Link
                  to="/client/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-onyx-800/80 border border-champagne-400/30 text-pearl text-sm font-semibold hover:bg-onyx-700 transition"
                >
                  Existing client login
                </Link>
              </div>
            </div>

            {/* module-card mosaic */}
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-champagne-500/15 via-onyx-900 to-champagne-700/10 rounded-[2rem] blur-2xl" />
              <div className="relative grid grid-cols-2 gap-4">
                <ModuleCard tone="champagne" title="Live Bullion" value="₹ 76,420" caption="22K · per 10g" />
                <ModuleCard tone="onyx" title="Active Orders" value="142" caption="across 9 depts" />
                <ModuleCard tone="onyx" title="Vendors" value="GST verified" caption="auto-filled" badge="LIVE" />
                <ModuleCard tone="champagne" title="Workforce" value="38" caption="artisans on shift" />
                <ModuleCard tone="onyx" title="Diamond Lots" value="217" caption="tracked + reconciled" className="col-span-2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────  CTA (SpotlightGrain)  ──────────────── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-onyx-800 via-onyx-900 to-onyx-800 p-10 sm:p-14 text-center shadow-2xl border border-champagne-500/20">
          <SpotlightGrain className="absolute inset-0" />
          <div className="relative">
            <ClockIcon className="mx-auto h-10 w-10 text-champagne-300" />
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl font-semibold text-pearl">
              Ready to bring order to the floor?
            </h2>
            <p className="mt-3 text-pearl/70 max-w-2xl mx-auto">
              Onboard in minutes. Your team, your vendors, your workflow — exactly the way you run them.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/client/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-champagne-300 via-champagne-400 to-champagne-600 text-onyx-900 font-semibold shadow-lg hover:from-champagne-200 hover:to-champagne-500 transition"
              >
                <UserGroupIcon className="w-5 h-5" />
                Register as Client
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-pearl/10 border border-pearl/20 text-pearl font-semibold backdrop-blur hover:bg-pearl/20 transition"
              >
                Staff Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────  FOOTER (EmberDrift)  ──────────────── */}
      <footer className="relative overflow-hidden border-t border-champagne-500/15">
        <EmberDrift className="absolute inset-0" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid sm:grid-cols-3 gap-8 items-start">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-onyx-800 via-onyx-900 to-onyx-700 flex items-center justify-center ring-1 ring-champagne-300/30">
                <BrandMark className="w-7 h-7" />
              </div>
              <div className="font-serif text-2xl font-semibold tracking-tight bg-gradient-to-r from-pearl via-champagne-200 to-champagne-400 bg-clip-text text-transparent">
                Ativa Jewels
              </div>
            </div>

            <div className="text-sm text-pearl/60 sm:text-center">
              © {new Date().getFullYear()} Ativa Jewels. Crafted with care in India.
            </div>

            <div className="flex sm:justify-end items-center gap-5 text-sm">
              <Link to="/login" className="text-pearl/60 hover:text-pearl transition">Staff</Link>
              <Link to="/client/login" className="text-pearl/60 hover:text-pearl transition">Client</Link>
              <Link
                to="/client/register"
                className="font-semibold text-champagne-300 hover:text-champagne-200 transition"
              >
                Register →
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ───────── helpers ─────────

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string; }) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <span className="inline-block px-3 py-1 text-[10px] uppercase tracking-[0.18em] font-semibold rounded-full bg-champagne-400/10 text-champagne-300 border border-champagne-400/30 backdrop-blur">
        {eyebrow}
      </span>
      <h2 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-pearl tracking-tight leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-pearl/65 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

function ModuleCard({
  tone,
  title,
  value,
  caption,
  badge,
  className = '',
}: {
  tone: 'onyx' | 'champagne';
  title: string;
  value: string;
  caption: string;
  badge?: string;
  className?: string;
}) {
  const isGold = tone === 'champagne';
  return (
    <div
      className={`group relative rounded-2xl border p-5 shadow-lg overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] ${
        isGold
          ? 'bg-gradient-to-br from-champagne-300 via-champagne-400 to-champagne-600 text-onyx-900 border-champagne-300/50 hover:shadow-[0_20px_40px_-10px_rgba(245,225,181,0.45)]'
          : 'bg-onyx-800/70 text-pearl border-champagne-400/20 hover:border-champagne-400/60 hover:shadow-[0_20px_40px_-15px_rgba(245,225,181,0.3)]'
      } ${className}`}
    >
      {/* sheen sweep on hover */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute -inset-[100%] bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.25)_50%,transparent_60%)] -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      </div>
      {badge && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-emerald-400/15 text-emerald-300 border border-emerald-400/40">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {badge}
        </span>
      )}
      <p className={`text-[10px] uppercase tracking-[0.14em] font-semibold ${isGold ? 'text-onyx-800/80' : 'text-champagne-400'}`}>
        {title}
      </p>
      <p className="mt-1 font-serif text-2xl sm:text-3xl font-semibold">{value}</p>
      <p className={`mt-0.5 text-xs ${isGold ? 'text-onyx-800/70' : 'text-pearl/60'}`}>{caption}</p>
      {!isGold && (
        <div className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-champagne-400/15 blur-2xl" />
      )}
    </div>
  );
}
