"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  q: string;
  a: string;
}

export function FAQAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="flex w-full items-center justify-between px-6 py-4 text-left font-semibold text-foreground hover:bg-muted/40"
            >
              <span>{item.q}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-purple transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            {isOpen && (
              <div className="border-t border-border/60 px-6 py-4 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
