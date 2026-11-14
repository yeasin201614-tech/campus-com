import { getAuthContext } from "@/lib/auth";
import { getPlatformCmsConfig } from "@/lib/cms";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [cms, auth] = await Promise.all([getPlatformCmsConfig(), getAuthContext()]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar
        cms={cms}
        isAuthenticated={Boolean(auth)}
        userRole={auth?.effectiveRole}
      />
      <main className="flex-1">{children}</main>
      <PublicFooter cms={cms} />
    </div>
  );
}
