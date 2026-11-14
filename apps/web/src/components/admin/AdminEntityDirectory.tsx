import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface DirectoryColumn {
  key: string;
  label: string;
  kind?: "text" | "badge" | "date";
}

export function AdminEntityDirectory({
  title,
  subtitle,
  columns,
  rows,
  actionSlot,
}: {
  title: string;
  subtitle: string;
  columns: DirectoryColumn[];
  rows: Array<Record<string, unknown>>;
  actionSlot?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy dark:text-white">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {actionSlot}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="p-4">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, idx) => (
                <tr key={String(row.id ?? idx)} className="hover:bg-muted/30">
                  {columns.map((col) => {
                    const val = row[col.key];
                    if (col.kind === "badge") {
                      return (
                        <td key={col.key} className="p-4">
                          <Badge variant="teal" className="capitalize">{String(val ?? "—")}</Badge>
                        </td>
                      );
                    }
                    if (col.kind === "date") {
                      return (
                        <td key={col.key} className="p-4 text-muted-foreground">
                          {val ? new Date(String(val)).toLocaleString() : "—"}
                        </td>
                      );
                    }
                    return <td key={col.key} className="p-4 font-medium">{String(val ?? "—")}</td>;
                  })}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-muted-foreground">
                    No records found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
