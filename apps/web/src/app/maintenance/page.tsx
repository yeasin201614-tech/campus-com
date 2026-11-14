import Link from "next/link";
import { Wrench } from "lucide-react";
import { CampusLogo } from "@/components/brand/CampusLogo";
import { Button } from "@/components/ui/button";
import { getPlatformCmsConfig } from "@/lib/cms";

export default async function MaintenancePage() {
  const cms = await getPlatformCmsConfig();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <CampusLogo href="" size="lg" showTagline />
      <div className="mt-8 max-w-md rounded-3xl border border-border bg-card p-8 shadow-campus-lg space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple/10 text-purple">
          <Wrench className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-navy dark:text-white">
          Scheduled Campus Maintenance
        </h1>
        <p className="text-sm text-muted-foreground">{cms.maintenance_mode.message}</p>
        <Link href="/login">
          <Button variant="outline" size="sm">
            Super Admin Login
          </Button>
        </Link>
      </div>
    </div>
  );
}
