import { Badge } from "@/components/ui/badge";
import { PricingGrid } from "@/components/public/PricingGrid";
import { getPublicPricingPlans } from "@/lib/cms";

export default async function PricingPage() {
  const plans = await getPublicPricingPlans();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 space-y-12">
      <div className="mx-auto max-w-2xl text-center space-y-3">
        <Badge variant="teal">Transparent Pricing</Badge>
        <h1 className="text-4xl font-extrabold text-navy dark:text-white">
          Plans Built to Scale With Every Campus
        </h1>
        <p className="text-muted-foreground">
          Switch between monthly and yearly billing. Upgrade, downgrade, or start with a Free campus pilot anytime.
        </p>
      </div>

      <PricingGrid plans={plans} />
    </div>
  );
}
