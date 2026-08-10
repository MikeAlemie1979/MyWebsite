import React from "react";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Breadcrumb trail. The final crumb is the current page and is marked
 * aria-current rather than linked.
 */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="page-margin pt-4 pb-2 text-[11px] tracking-wide">
      <ol className="flex flex-wrap items-center gap-2">
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-2">
              {crumb.href && !last ? (
                <a href={crumb.href} className="opacity-60 hover:opacity-100 transition-opacity underline-offset-4 hover:underline">
                  {crumb.label}
                </a>
              ) : (
                <span aria-current={last ? "page" : undefined} style={{ opacity: last ? 0.9 : 0.6 }}>
                  {crumb.label}
                </span>
              )}
              {!last && (
                <span aria-hidden style={{ opacity: 0.35 }}>
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
