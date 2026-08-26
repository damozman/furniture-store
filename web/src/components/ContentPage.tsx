import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * Shell for the editorial / policy pages. They share a shape: breadcrumb, a
 * narrow measure for reading, and generous type.
 */
export function ContentPage({
  title, intro, children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 lg:py-16">
        <nav className="mb-8 text-sm text-bark">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span className="mx-2">/</span>
          <span>{title}</span>
        </nav>

        <h1 className="text-4xl sm:text-5xl">{title}</h1>
        {intro && <p className="mt-5 text-lg text-bark">{intro}</p>}

        <div className="mt-12 space-y-10">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

export function Section({
  heading, children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-bone pt-8">
      <h2 className="text-2xl">{heading}</h2>
      <div className="mt-4 space-y-4 text-bark [&_strong]:text-ink">{children}</div>
    </section>
  );
}

/**
 * Marks copy that states a business policy we have not been given. Rendering it
 * visibly is deliberate: a placeholder that looks like finished copy is how an
 * invented returns window ends up load-bearing on a live site.
 */
export function NeedsConfirmation({ children }: { children: ReactNode }) {
  return (
    <p className="border-l-2 border-brass bg-bone/40 py-3 pl-4 text-sm">
      <strong className="text-ink">To confirm:</strong> {children}
    </p>
  );
}
