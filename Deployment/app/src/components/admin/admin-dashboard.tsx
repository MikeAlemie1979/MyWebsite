"use client";

import React, { useState } from "react";
import { SMTPSettingsPanel } from "./smtp-settings-panel";
import { HomeTextManager } from "./home-text-manager";
import { CardsManager } from "./cards-manager";
import { AboutManager } from "./about-manager";
import { ProjectsManager } from "./projects-manager";
import { SocialMediaPanel } from "./social-media-panel";
import { StoragePanel } from "./storage-panel";
import { Breadcrumbs } from "@/components/common/breadcrumbs";

type Section = "email" | "social" | "storage" | "home-text" | "cards" | "about" | "projects";

function PageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 2h9l5 5v15H6V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M15 2v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function SectionIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="12" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="19" width="10" height="2" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface LeafItem {
  id: Section;
  label: string;
}

interface NavGroup {
  category: string;
  icon: React.ReactNode;
  description: string;
  /** Flat items rendered directly under the category (used for Pages / System). */
  items?: LeafItem[];
  /** A nested parent (e.g. "Home") whose children render indented, for grouping
   * sections that all belong to a single page rather than being standalone routes. */
  nested?: { parentLabel: string; children: LeafItem[] };
}

const NAV_GROUPS: NavGroup[] = [
  {
    category: "Pages",
    icon: <PageIcon />,
    description: "Standalone routes",
    items: [
      { id: "about", label: "About" },
      { id: "projects", label: "Projects & Prices" },
    ],
  },
  {
    category: "Homepage Sections",
    icon: <SectionIcon />,
    description: "Parts of the Home page",
    nested: {
      parentLabel: "Home",
      children: [
        { id: "home-text", label: "Ash Text" },
        { id: "cards", label: "Cards" },
      ],
    },
  },
  {
    category: "System",
    icon: <SystemIcon />,
    description: "Integrations, not content",
    items: [
      { id: "email", label: "Email (SMTP)" },
      { id: "social", label: "Social Media" },
      { id: "storage", label: "Storage" },
    ],
  },
];

function NavButton({
  item,
  active,
  onClick,
  indent,
}: {
  item: LeafItem;
  active: boolean;
  onClick: () => void;
  indent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded transition-colors text-sm ${
        indent ? "pl-8 pr-4 py-1.5" : "px-4 py-2"
      } ${active ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
    >
      {item.label}
    </button>
  );
}

export function AdminDashboard() {
  // The Google Drive OAuth callback redirects back to /admin?drive_connect=...
  // rather than staying client-side (it's a full navigation from Google), so
  // land on Storage in that case or its result message would never be seen.
  const [activeSection, setActiveSection] = useState<Section>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("drive_connect")
      ? "storage"
      : "home-text"
  );

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      // Hard navigation, not router.push: a soft push keeps the App Router's
      // client cache, so the dashboard could stay on screen even though the
      // session cookie was just cleared. Replacing the document also drops
      // /admin from history, so Back cannot return to the logged-in view.
      window.location.replace("/");
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumbs uses "page-margin" (30px) horizontal padding, which
            reads as a slight left offset here since the dashboard's own
            container already applies p-8 — pull it back so the crumb aligns
            with the rest of the dashboard content. */}
        <div className="-mx-8 mb-2">
          <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Admin" }]} />
        </div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-sm tracking-widest uppercase px-5 py-2 rounded-full border border-white/20 hover:border-white/60 hover:bg-white/5 transition-colors"
          >
            Log Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-6">
              {NAV_GROUPS.map((group) => (
                <div key={group.category}>
                  <div className="flex items-center gap-2 mb-1 text-gray-500">
                    {group.icon}
                    <h3 className="text-xs uppercase tracking-wider font-semibold">
                      {group.category}
                    </h3>
                  </div>
                  <p className="text-[11px] leading-relaxed text-gray-400 mb-3 pl-[22px]">{group.description}</p>

                  {group.items && (
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <NavButton
                          key={item.id}
                          item={item}
                          active={activeSection === item.id}
                          onClick={() => setActiveSection(item.id)}
                        />
                      ))}
                    </div>
                  )}

                  {group.nested && (
                    <div className="space-y-1">
                      <p className="px-4 py-1 text-sm text-gray-300">{group.nested.parentLabel}</p>
                      {group.nested.children.map((item) => (
                        <NavButton
                          key={item.id}
                          item={item}
                          active={activeSection === item.id}
                          onClick={() => setActiveSection(item.id)}
                          indent
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection === "email" && <SMTPSettingsPanel />}
            {activeSection === "home-text" && <HomeTextManager />}
            {activeSection === "cards" && <CardsManager />}
            {activeSection === "about" && <AboutManager />}
            {activeSection === "projects" && <ProjectsManager />}
            {activeSection === "social" && <SocialMediaPanel />}
            {activeSection === "storage" && <StoragePanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
