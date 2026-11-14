import Link from "next/link";
import { CampusLogo } from "@/components/brand/CampusLogo";
import type { PlatformCmsConfig } from "@/lib/cms";
import { Mail, MapPin, Phone } from "lucide-react";

export function PublicFooter({ cms }: { cms: PlatformCmsConfig }) {
  return (
    <footer className="border-t border-border bg-navy-950 text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <CampusLogo href="/" variant="light" showTagline size="md" />
            <p className="max-w-sm text-sm leading-relaxed text-slate-300">
              {cms.footer.description}
            </p>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-teal" />
                <span>{cms.contact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-teal" />
                <span>{cms.contact.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-teal" />
                <span>{cms.contact.address}</span>
              </div>
            </div>
          </div>

          {cms.footer.columns.map((col) => (
            <div key={col.title} className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-300">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-teal"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>{cms.branding.copyright}</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms & Conditions
            </Link>
            <Link href="/contact" className="hover:text-white">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
