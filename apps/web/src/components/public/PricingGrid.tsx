"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import type { SubscriptionPlan } from "@campus/shared";

export function PricingGrid({ plans }: { plans: SubscriptionPlan[] }) {
  const [yearly, setYearly] = useState(true);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center gap-3">
        <span className={cn("text-sm font-semibold", !yearly ? "text-foreground" : "text-muted-foreground")}>
          Monthly Billing
        </span>
        <button
          type="button"
          onClick={() => setYearly((v) => !v)}
          aria-label="Toggle billing cycle"
          className={cn(
            "relative inline-flex h-7 w-14 items-center rounded-full p-1 transition-colors",
            yearly ? "bg-purple" : "bg-navy"
          )}
        >
          <span
            className={cn(
              "h-5 w-5 rounded-full bg-white transition-transform",
              yearly ? "translate-x-7" : "translate-x-0"
            )}
          />
        </button>
        <span className={cn("text-sm font-semibold", yearly ? "text-foreground" : "text-muted-foreground")}>
          Yearly Billing
        </span>
        <Badge variant="teal">Save ~17%</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const price = yearly ? plan.price_yearly / 12 : plan.price_monthly;
          const totalAnnual = plan.price_yearly;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col justify-between transition-all hover:-translate-y-1",
                plan.is_popular && "border-2 border-purple shadow-campus-lg"
              )}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple text-white shadow-sm">
                    <Sparkles className="h-3 w-3" /> Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-navy dark:text-white">{plan.name}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="pt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-navy dark:text-white">
                      {formatCurrency(price, plan.currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  {yearly && totalAnnual > 0 && (
                    <p className="mt-1 text-xs text-teal font-medium">
                      Billed {formatCurrency(totalAnnual, plan.currency)} yearly
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="rounded-xl bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground">
                  {plan.max_students ? `Up to ${plan.max_students.toLocaleString()} students` : "Unlimited students"} •{" "}
                  {plan.storage_limit_gb} GB storage
                </div>
                <ul className="space-y-2.5">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Link href={`/register?plan=${plan.slug}`} className="w-full">
                  <Button
                    variant={plan.is_popular ? "default" : "outline"}
                    className="w-full"
                  >
                    {plan.price_monthly === 0 ? "Start Free Pilot" : `Choose ${plan.name}`}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
