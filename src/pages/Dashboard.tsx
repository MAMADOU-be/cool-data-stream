import { useEffect } from "react";
import { useFridgeData } from "@/hooks/useFridgeData";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Battery, Zap, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

function CircularBattery({ value }: { value: number | null }) {
  const pct = value ?? 0;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const colorClass =
    pct < 20 ? "text-destructive" : pct < 50 ? "text-warning" : "text-success";

  return (
    <div className="relative inline-flex h-32 w-32 items-center justify-center">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          className="text-muted"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700", colorClass)}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold" data-testid="battery">
          {value !== null ? `${Math.round(value)}%` : "—"}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { temperature, battery, voltage, alerts } = useFridgeData();
  const activeAlertsList = alerts.filter((a) => !a.is_read);
  const activeAlerts = activeAlertsList.length;
  const activeTypes = Array.from(new Set(activeAlertsList.map((a) => a.type)));

  useEffect(() => {
    document.title = "Dashboard · Solar Fridge";
  }, []);

  const tempColor =
    temperature === null
      ? "text-muted-foreground"
      : temperature > 5
      ? "text-destructive"
      : temperature < 1
      ? "text-primary"
      : "text-success";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">État du frigo solaire en temps réel</p>
        </div>
        {activeAlerts > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge
              variant="destructive"
              className="gap-1.5 px-3 py-1.5 text-sm"
              data-testid="alert-badge"
            >
              <AlertTriangle className="h-4 w-4" />
              {activeAlerts} active{activeAlerts > 1 ? "s" : ""}
            </Badge>
            {activeTypes.map((t) => (
              <Badge key={t} variant="outline" className="border-destructive/40 text-destructive">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2 lg:col-span-1" style={{ boxShadow: "var(--shadow-elegant)" }}>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Température actuelle
            </CardTitle>
            <Thermometer className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-6xl font-bold", tempColor)} data-testid="temperature">
              {temperature !== null ? `${temperature.toFixed(1)}°` : "—"}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">degrés Celsius</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Batterie</CardTitle>
            <Battery className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <CircularBattery value={battery} />
            <p className="mt-3 text-xs text-muted-foreground">Charge restante</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tension</CardTitle>
            <Zap className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {voltage !== null ? `${voltage.toFixed(2)} V` : "—"}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">12V nominal</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alertes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucune alerte pour le moment
            </p>
          ) : (
            <ul className="space-y-2">
              {alerts.slice(0, 5).map((a) => (
                <li
                  key={a.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 text-sm",
                    !a.is_read && "border-destructive/40 bg-destructive/5"
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "mt-0.5 h-4 w-4 flex-shrink-0",
                      a.is_read ? "text-muted-foreground" : "text-destructive"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{a.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
