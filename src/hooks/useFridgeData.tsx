import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface AlertRow {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

interface FridgeContextValue {
  temperature: number | null;
  battery: number | null;
  voltage: number | null;
  alerts: AlertRow[];
  toggleAlertRead: (id: string, current: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

const FridgeContext = createContext<FridgeContextValue | undefined>(undefined);

const TEMP_THRESHOLD_KEY = "solar-fridge:temp-threshold";

function getThreshold(): number {
  const raw = localStorage.getItem(TEMP_THRESHOLD_KEY);
  const n = raw ? parseFloat(raw) : 5;
  return Number.isFinite(n) ? n : 5;
}

export function FridgeDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [temperature, setTemperature] = useState<number | null>(null);
  const [battery, setBattery] = useState<number | null>(null);
  const [voltage, setVoltage] = useState<number | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setAlerts((data as AlertRow[]) ?? []);
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (!user) return;
    refresh();
  }, [user, refresh]);

  // Mock real-time generator — simulates sensor data
  useEffect(() => {
    if (!user) return;

    let baseTemp = 4 + Math.random() * 2;
    let baseBatt = 70 + Math.random() * 20;

    const tick = async () => {
      // small random walk
      baseTemp += (Math.random() - 0.5) * 0.6;
      baseTemp = Math.max(0, Math.min(15, baseTemp));
      baseBatt += (Math.random() - 0.55) * 1.5;
      baseBatt = Math.max(5, Math.min(100, baseBatt));
      const v = 11.5 + (baseBatt / 100) * 1.4; // 11.5–12.9V

      setTemperature(parseFloat(baseTemp.toFixed(2)));
      setBattery(parseFloat(baseBatt.toFixed(1)));
      setVoltage(parseFloat(v.toFixed(2)));

      // persist measurement & battery
      await supabase.from("measurements").insert({
        user_id: user.id,
        temperature: baseTemp,
        voltage: v,
      });
      await supabase.from("batteries").insert({
        user_id: user.id,
        voltage: v,
        percentage: baseBatt,
      });

      // generate alert if thresholds breached
      const threshold = getThreshold();
      if (baseTemp > threshold) {
        const { data } = await supabase
          .from("alerts")
          .insert({
            user_id: user.id,
            type: "temperature_high",
            message: `Température ${baseTemp.toFixed(1)}°C au-dessus du seuil ${threshold}°C`,
          })
          .select()
          .single();
        if (data) setAlerts((prev) => [data as AlertRow, ...prev]);
      }
      if (baseBatt < 20) {
        const { data } = await supabase
          .from("alerts")
          .insert({
            user_id: user.id,
            type: "battery_low",
            message: `Batterie faible : ${baseBatt.toFixed(0)}%`,
          })
          .select()
          .single();
        if (data) setAlerts((prev) => [data as AlertRow, ...prev]);
      }
    };

    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const toggleAlertRead = async (id: string, current: boolean) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: !current } : a)));
    await supabase.from("alerts").update({ is_read: !current }).eq("id", id);
  };

  return (
    <FridgeContext.Provider
      value={{ temperature, battery, voltage, alerts, toggleAlertRead, refresh }}
    >
      {children}
    </FridgeContext.Provider>
  );
}

export function useFridgeData() {
  const ctx = useContext(FridgeContext);
  if (!ctx) throw new Error("useFridgeData must be used inside FridgeDataProvider");
  return ctx;
}
