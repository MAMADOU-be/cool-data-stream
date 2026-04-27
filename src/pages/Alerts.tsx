import { useEffect, useMemo, useState } from "react";
import { useFridgeData } from "@/hooks/useFridgeData";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type FilterMode = "all" | "active";

export default function Alerts() {
  const { alerts, toggleAlertRead } = useFridgeData();
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [filter, setFilter] = useState<FilterMode>("active");

  useEffect(() => {
    document.title = "Alertes · Solar Fridge";
  }, []);

  const activeCount = useMemo(() => alerts.filter((a) => !a.is_read).length, [alerts]);
  const filtered = useMemo(
    () => (filter === "active" ? alerts.filter((a) => !a.is_read) : alerts),
    [alerts, filter]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alertes</h1>
        <p className="text-muted-foreground">
          {activeCount} active{activeCount > 1 ? "s" : ""} · {alerts.length} au total
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">Historique</CardTitle>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterMode)}>
            <TabsList>
              <TabsTrigger value="active">Actives ({activeCount})</TabsTrigger>
              <TabsTrigger value="all">Toutes ({alerts.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {filter === "active" ? "Aucune alerte active" : "Aucune alerte enregistrée"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Lu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow
                      key={a.id}
                      className={cn(!a.is_read && "bg-destructive/5")}
                    >
                      <TableCell>
                        <Badge variant={a.type.includes("high") || a.type.includes("low") ? "destructive" : "secondary"}>
                          {a.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">{a.message}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={a.is_read}
                          onCheckedChange={() => toggleAlertRead(a.id, a.is_read)}
                          aria-label="Marquer comme lu"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
