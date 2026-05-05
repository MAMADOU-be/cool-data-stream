import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFridgeData, Mesure } from "@/hooks/useFridgeData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend } from "recharts";

type Range = "24h" | "7d" | "30d";
const ranges: Record<Range, number> = { "24h": 24 * 3600 * 1000, "7d": 7 * 86400 * 1000, "30d": 30 * 86400 * 1000 };

export default function Historique() {
  const { chambre } = useFridgeData();
  const [range, setRange] = useState<Range>("24h");
  const [data, setData] = useState<Mesure[]>([]);

  useEffect(() => { document.title = "Historique · Doundeul Récolte"; }, []);

  useEffect(() => {
    if (!chambre) return;
    const since = new Date(Date.now() - ranges[range]).toISOString();
    supabase.from("mesures").select("*").eq("chambre_id", chambre.id)
      .gte("timestamp", since).order("timestamp", { ascending: true }).limit(5000)
      .then(({ data }) => setData((data as Mesure[]) ?? []));
  }, [chambre, range]);

  const chartData = useMemo(() => {
    // groupe par minute (24h) ou heure (7d/30d)
    const bucket = range === "24h" ? 60_000 : 3600_000;
    const map = new Map<number, { t: number; temp?: number; humid?: number; tn: number; hn: number }>();
    for (const m of data) {
      const k = Math.floor(new Date(m.timestamp).getTime() / bucket) * bucket;
      const e = map.get(k) ?? { t: k, tn: 0, hn: 0 };
      if (m.type === "temperature") { e.temp = (e.temp ?? 0) + m.valeur; e.tn += 1; }
      else if (m.type === "humidite") { e.humid = (e.humid ?? 0) + m.valeur; e.hn += 1; }
      map.set(k, e);
    }
    return Array.from(map.values())
      .sort((a, b) => a.t - b.t)
      .map((e) => ({
        t: e.t,
        label: range === "24h"
          ? new Date(e.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : new Date(e.t).toLocaleDateString([], { day: "2-digit", month: "2-digit" }),
        temperature: e.tn ? +(e.temp! / e.tn).toFixed(2) : null,
        humidite: e.hn ? +(e.humid! / e.hn).toFixed(1) : null,
      }));
  }, [data, range]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historique des mesures</h1>
          <p className="text-muted-foreground">Évolution de la température et de l'humidité</p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="24h">24 heures</TabsTrigger>
            <TabsTrigger value="7d">7 jours</TabsTrigger>
            <TabsTrigger value="30d">30 jours</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Température</CardTitle>
          <CardDescription>Seuil critique : 4°C</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="°C" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <ReferenceLine y={4} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label="Seuil" />
                <Line type="monotone" dataKey="temperature" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Humidité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="%" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Line type="monotone" dataKey="humidite" name="Humidité" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
