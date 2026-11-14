"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (val: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const value = controlledValue ?? internal;

  const setVal = (v: string) => {
    setInternal(v);
    onValueChange?.(v);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: setVal }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(TabsContext);
  const active = ctx?.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx?.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}
