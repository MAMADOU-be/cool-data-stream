import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Bell, Settings, LogOut, Sun, History, Users, Moon, Leaf } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFridgeData } from "@/hooks/useFridgeData";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { signOut, user, role, isAdmin } = useAuth();
  const { alerts } = useFridgeData();
  const { theme, toggle } = useTheme();
  const actives = alerts.filter((a) => a.etat === "creee" || a.etat === "active").length;

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/historique", label: "Historique", icon: History },
    { to: "/alerts", label: "Alertes", icon: Bell, badge: actives },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Users }] : []),
    { to: "/settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Aurora background accent */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[40vh] bg-gradient-aurora blur-3xl opacity-70" />

      <header className="sticky top-0 z-20 border-b border-border/60 glass-strong">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <Link to="/dashboard" className="group flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-solar shadow-elegant transition-transform duration-300 group-hover:scale-105">
              <Leaf className="h-5 w-5 text-secondary-foreground" />
              <span className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-solar opacity-30 blur-md" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-bold tracking-tight">Doundeul Récolte</span>
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:block">
                Chaîne du froid solaire
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-0.5 rounded-full border border-border/60 bg-background/40 p-1 backdrop-blur lg:flex">
            {navItems.map(({ to, label, icon: Icon, badge }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 gap-2 rounded-full px-3 text-sm transition-all",
                      active
                        ? "bg-gradient-primary text-primary-foreground shadow-elegant hover:bg-gradient-primary hover:opacity-95"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    {badge ? (
                      <Badge
                        variant={active ? "secondary" : "destructive"}
                        className="ml-0.5 h-4 px-1.5 text-[10px]"
                      >
                        {badge}
                      </Badge>
                    ) : null}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden text-right text-xs sm:block">
              <div className="font-medium">{user?.email}</div>
              <div className="flex items-center justify-end gap-1.5">
                <Badge variant={isAdmin ? "default" : "secondary"} className="h-5 px-1.5 text-[10px] capitalize">
                  {role ?? "user"}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Basculer le thème"
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Se déconnecter" className="rounded-full">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="flex overflow-x-auto border-t border-border/60 lg:hidden">
          {navItems.map(({ to, label, icon: Icon, badge }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-1 min-w-[80px] items-center justify-center gap-1.5 py-3 text-xs transition-colors",
                  active ? "border-b-2 border-primary font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {badge ? <Badge variant="destructive" className="h-4 px-1 text-[10px]">{badge}</Badge> : null}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 animate-fade-in">{children}</main>
    </div>
  );
}
