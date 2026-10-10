"use client";

import { useState, useTransition } from "react";
import {
  Bell,
  Search,
  Home,
  FileText,
  CheckSquare,
  FolderOpen,
  Check,
  Pencil,
  X,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approveApplicationAction, requestChangesAction } from "./actions";

type Application = {
  id: string;
  status: string;
  approvalStatus: string;
  createdAt: Date;
  aiMatchScore: number | null;
  job: { position: string; company: { name: string } };
  resumeVersion: { targetRoleArchetype: string | null } | null;
};

const NAV = [
  { label: "Home", icon: Home },
  { label: "Applications", icon: FileText },
  { label: "Approvals", icon: CheckSquare },
  { label: "Documents", icon: FolderOpen },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; fg: string; border?: string }> = {
    SUBMITTED: { bg: "var(--pine-tint)", fg: "var(--pine-deep)" },
    INTERVIEW: { bg: "var(--brass-tint)", fg: "#7A551F" },
    OFFER: { bg: "var(--pine)", fg: "#FFFEFB" },
    WAITING_APPROVAL: { bg: "#FFFFFF", fg: "var(--brass)", border: "1.5px solid var(--brass)" },
    REJECTED: { bg: "var(--mist)", fg: "var(--ink-soft)" },
  };
  const s = styles[status] || { bg: "var(--mist)", fg: "var(--ink-soft)" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.fg, border: s.border || "none" }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function MetricCard({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="rounded-2xl p-5 flex-1 min-w-[160px] bg-card border border-mist">
      <p className="text-xs uppercase tracking-wide text-sage" style={{ letterSpacing: "0.08em" }}>
        {label}
      </p>
      <p className="font-mono text-3xl mt-2 text-ink">{value}</p>
      {sublabel && <p className="text-xs mt-1 text-ink-soft">{sublabel}</p>}
    </div>
  );
}

function ApplicationsTable({
  applications,
  onSelect,
}: {
  applications: Application[];
  onSelect: (a: Application) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = applications.filter(
    (a) =>
      search === "" ||
      a.job.company.name.toLowerCase().includes(search.toLowerCase()) ||
      a.job.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-2xl p-6 bg-card border border-mist">
      <div className="flex items-center justify-between mb-1">
        <p className="font-display text-xl text-ink">Applications</p>
      </div>
      <p className="text-xs mb-4 text-sage">Click any row for the full detail.</p>
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company or role…"
          className="pl-9 rounded-full"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mist">
              {["Company", "Role", "Resume", "Date", "Status"].map((h) => (
                <th
                  key={h}
                  className="text-left pb-3 font-medium text-xs uppercase text-sage"
                  style={{ letterSpacing: "0.06em" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr
                key={a.id}
                onClick={() => onSelect(a)}
                className="cursor-pointer hover:bg-paper"
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--mist)" : "none" }}
              >
                <td className="py-3 font-medium text-ink">{a.job.company.name}</td>
                <td className="py-3 text-ink-soft">{a.job.position}</td>
                <td className="py-3 font-mono text-xs text-sage">
                  {a.resumeVersion?.targetRoleArchetype ?? "—"}
                </td>
                <td className="py-3 font-mono text-xs text-ink-soft">
                  {new Date(a.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <StatusBadge status={a.status} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-sage">
                  No applications match that search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApprovalsPanel({ applications }: { applications: Application[] }) {
  const waiting = applications.filter((a) => a.status === "WAITING_APPROVAL");
  const [isPending, startTransition] = useTransition();
  const [decided, setDecided] = useState<Record<string, "approved" | "changes">>({});

  return (
    <div className="rounded-2xl p-6 bg-card border border-mist">
      <p className="font-display text-xl mb-1 text-ink">Waiting on you</p>
      <p className="text-sm mb-4 text-ink-soft">
        Review the tailored materials, then approve or send back a note.
      </p>
      <div className="space-y-3">
        {waiting.map((a) => {
          const status = decided[a.id];
          return (
            <div key={a.id} className="rounded-xl p-4 bg-paper border border-mist">
              <p className="font-medium text-ink">{a.job.company.name}</p>
              <p className="text-xs text-ink-soft">{a.job.position}</p>
              {status ? (
                <p
                  className="text-xs mt-3 flex items-center gap-1.5 font-medium"
                  style={{ color: status === "approved" ? "var(--pine-deep)" : "var(--brass)" }}
                >
                  <Check size={13} />
                  {status === "approved" ? "Approved — ready for submission" : "Sent back for changes"}
                </p>
              ) : (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    disabled={isPending}
                    className="flex-1"
                    onClick={() =>
                      startTransition(async () => {
                        await approveApplicationAction(a.id);
                        setDecided((d) => ({ ...d, [a.id]: "approved" }));
                      })
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    className="flex-1"
                    onClick={() =>
                      startTransition(async () => {
                        await requestChangesAction(a.id, "Customer requested changes from dashboard");
                        setDecided((d) => ({ ...d, [a.id]: "changes" }));
                      })
                    }
                  >
                    <Pencil size={12} /> Request changes
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {waiting.length === 0 && (
          <p className="text-sm text-sage">Nothing waiting on you right now.</p>
        )}
      </div>
    </div>
  );
}

function ApplicationDrawer({ app, onClose }: { app: Application | null; onClose: () => void }) {
  if (!app) return null;
  return (
    <>
      <div className="fixed inset-0 z-20" style={{ background: "rgba(28,35,32,0.35)" }} onClick={onClose} />
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-[440px] z-30 p-6 overflow-y-auto bg-card"
        style={{ borderLeft: "1px solid var(--mist)" }}
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="font-display text-2xl text-ink">{app.job.company.name}</p>
            <p className="text-sm text-ink-soft">{app.job.position}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full text-ink-soft">
            <X size={18} />
          </button>
        </div>
        <div className="mt-2">
          <StatusBadge status={app.status} />
        </div>
        {app.aiMatchScore != null && (
          <div className="mt-6 rounded-xl p-4 bg-paper border border-mist">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-brass" />
              <p className="text-sm font-medium text-ink">Match score — {app.aiMatchScore}%</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function CustomerDashboardClient({
  customerName,
  applications,
}: {
  customerName: string;
  applications: Application[];
}) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const waitingCount = applications.filter((a) => a.status === "WAITING_APPROVAL").length;
  const submittedThisMonth = applications.filter((a) => {
    const d = new Date(a.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 px-6 md:px-10 py-3 flex items-center justify-between bg-background border-b border-mist">
        <div className="flex items-center gap-8">
          <span className="font-display text-lg text-pine-deep" style={{ letterSpacing: "0.02em" }}>
            Operon
          </span>
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item, i) => (
              <button
                key={item.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                style={{
                  background: i === 0 ? "var(--pine-tint)" : "transparent",
                  color: i === 0 ? "var(--pine-deep)" : "var(--ink-soft)",
                  fontWeight: i === 0 ? 600 : 400,
                }}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Notifications" className="p-2 rounded-full relative text-ink-soft">
            <Bell size={17} />
            {waitingCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--brass)" }}
              />
            )}
          </button>
          <button aria-label="Account" className="p-2 rounded-full text-ink-soft">
            <User size={17} />
          </button>
        </div>
      </header>

      <main className="px-6 md:px-10 py-8 max-w-6xl mx-auto space-y-6">
        <div>
          <p className="font-display text-3xl text-ink">Good afternoon, {customerName}.</p>
          <p className="text-sm mt-1 text-ink-soft">Your operations team is active on your search.</p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <MetricCard label="Applications this month" value={String(submittedThisMonth)} />
          <MetricCard label="Total applications" value={String(applications.length)} />
          <MetricCard label="Waiting on you" value={String(waitingCount)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ApplicationsTable applications={applications} onSelect={setSelectedApp} />
          </div>
          <div className="space-y-6">
            <ApprovalsPanel applications={applications} />
          </div>
        </div>

        <p className="text-center text-xs pt-4 pb-2 font-display italic text-sage">
          You own your career. We own the execution.
        </p>
      </main>

      <ApplicationDrawer app={selectedApp} onClose={() => setSelectedApp(null)} />
    </div>
  );
}
