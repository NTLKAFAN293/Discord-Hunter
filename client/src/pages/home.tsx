import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { ControlPanel } from "@/components/control-panel";
import { ResultsDisplay } from "@/components/results-display";
import { StatisticsPanel } from "@/components/statistics-panel";
import { ExportSection } from "@/components/export-section";
import { SiDiscord } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import type { UsernameCheck, CheckSettings, SessionStats, UsernameType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

const defaultSettings: CheckSettings = {
  usernameTypes: ["four"],
  includeLetters: true,
  includeNumbers: true,
  delayMs: 60000,
  dailyLimit: 50,
  prefix: "",
};

const defaultStats: SessionStats = {
  totalChecks: 0,
  availableCount: 0,
  unavailableCount: 0,
  startTime: undefined,
  checksToday: 0,
};

export default function Home() {
  const [settings, setSettings] = useState<CheckSettings>({
    usernameTypes: ["three", "four", "semiThree"],
    includeLetters: true,
    includeNumbers: true,
    delayMs: 5000,
    dailyLimit: 100,
    prefix: "",
  });
  const [isRunning, setIsRunning] = useState(false);
  const [queue, setQueue] = useState<UsernameCheck[]>([]);
  const [available, setAvailable] = useState<UsernameCheck[]>([]);
  const [unavailable, setUnavailable] = useState<UsernameCheck[]>([]);
  const [localStats, setLocalStats] = useState<SessionStats>(defaultStats);
  const { toast } = useToast();

  const runningRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const usernameQueueRef = useRef<Array<{ username: string; type: UsernameType }>>([]);

  const { data: serverStats } = useQuery<SessionStats>({
    queryKey: ["/api/stats"],
    refetchInterval: isRunning ? 10000 : false,
  });

  const stats = serverStats || localStats;

  const generateUsernames = useCallback(async (count: number): Promise<Array<{ username: string; type: UsernameType }>> => {
    try {
      const results: Array<{ username: string; type: UsernameType }> = [];
      for (const type of settings.usernameTypes) {
        const response = await apiRequest("POST", "/api/generate", {
          type,
          includeLetters: settings.includeLetters,
          includeNumbers: settings.includeNumbers,
          count: Math.ceil(count / settings.usernameTypes.length),
          prefix: settings.prefix || "",
        });
        const data = await response.json();
        if (data.usernames) {
          for (const username of data.usernames) {
            results.push({ username, type });
          }
        }
      }
      return results.slice(0, count);
    } catch {
      return [];
    }
  }, [settings.usernameTypes, settings.includeLetters, settings.includeNumbers, settings.prefix]);

  const getNextUsername = useCallback(async (): Promise<{ username: string; type: UsernameType } | null> => {
    if (usernameQueueRef.current.length === 0) {
      const newUsernames = await generateUsernames(10);
      usernameQueueRef.current = newUsernames;
    }
    return usernameQueueRef.current.shift() || null;
  }, [generateUsernames]);

  const checkUsername = useCallback(async (username: string): Promise<{ available: boolean; error?: string }> => {
    try {
      const response = await apiRequest("POST", "/api/check", { username });
      const data = await response.json();
      if (data.error === "Rate limited") {
        // Implement retry logic or increase delay
        return { available: false, error: "Rate limited" };
      }
      return { available: data.available, error: data.error };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection error";
      return { available: false, error: message };
    }
  }, []);

  const runCheckLoop = useCallback(async () => {
    if (!runningRef.current) return;

    const currentChecksToday = localStats.checksToday;
    if (currentChecksToday >= settings.dailyLimit) {
      setIsRunning(false);
      runningRef.current = false;
      toast({
        title: "تم الوصول للحد اليومي",
        description: "حاول مجدداً غداً",
        variant: "destructive",
      });
      return;
    }

    const generated = await getNextUsername();
    if (!generated || !runningRef.current) {
      if (runningRef.current) {
        timeoutRef.current = setTimeout(runCheckLoop, settings.delayMs);
      }
      return;
    }

    const { username, type } = generated;
    const id = `${username}-${Date.now()}`;

    const newCheck: UsernameCheck = {
      id,
      username,
      type,
      status: "checking",
    };

    setQueue((prev) => [newCheck, ...prev.slice(0, 9)]);

    const result = await checkUsername(username);

    if (!runningRef.current) return;

    setQueue((prev) => prev.filter((c) => c.id !== id));

    const completedCheck: UsernameCheck = {
      ...newCheck,
      status: result.available ? "available" : "taken",
      checkedAt: new Date().toISOString(),
    };

    if (result.available) {
      setAvailable((prev) => [completedCheck, ...prev]);
      toast({
        title: "اسم متاح!",
        description: `تم العثور على: ${username}`,
      });
    } else {
      setUnavailable((prev) => [completedCheck, ...prev.slice(0, 99)]);
    }

    setLocalStats((prev) => ({
      ...prev,
      totalChecks: prev.totalChecks + 1,
      availableCount: result.available ? prev.availableCount + 1 : prev.availableCount,
      unavailableCount: result.available ? prev.unavailableCount : prev.unavailableCount + 1,
      checksToday: prev.checksToday + 1,
    }));

    if (result.error && result.error !== "Rate limited") {
      toast({
        title: "تحذير",
        description: result.error,
        variant: "destructive",
      });
    }

    if (runningRef.current) {
      timeoutRef.current = setTimeout(runCheckLoop, settings.delayMs);
    }
  }, [getNextUsername, checkUsername, settings.delayMs, settings.dailyLimit, localStats.checksToday, toast]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
    runningRef.current = true;
    usernameQueueRef.current = [];
    if (!localStats.startTime) {
      setLocalStats((prev) => ({ ...prev, startTime: new Date().toISOString() }));
    }
    runCheckLoop();
  }, [runCheckLoop, localStats.startTime]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    runningRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleClear = useCallback(async () => {
    handleStop();
    setQueue([]);
    setAvailable([]);
    setUnavailable([]);
    setLocalStats(defaultStats);
    try {
      await apiRequest("DELETE", "/api/checks");
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    } catch {
      // Silent fail for clear
    }
  }, [handleStop]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  useEffect(() => {
    if (!isRunning || !localStats.startTime) {
      return;
    }

    const updateTimer = () => {
      const start = new Date(localStats.startTime!).getTime();
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setElapsedTime(
        [hours, minutes, seconds]
          .map((n) => n.toString().padStart(2, "0"))
          .join(":")
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isRunning, localStats.startTime]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <SiDiscord className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">فاحص أسماء Discord</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  اكتشف الأسماء الثلاثية والرباعية المتاحة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={isRunning ? "default" : "secondary"}
                className="gap-2"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isRunning ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
                  }`}
                />
                {isRunning ? "نشط" : "متوقف"}
              </Badge>
              {localStats.startTime && (
                <span className="font-mono text-sm text-muted-foreground">
                  {elapsedTime}
                </span>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section>
          <ControlPanel
            settings={settings}
            onSettingsChange={setSettings}
            isRunning={isRunning}
            onStart={handleStart}
            onStop={handleStop}
            checksToday={localStats.checksToday}
          />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">النتائج</h2>
          <ResultsDisplay
            queue={queue}
            available={available}
            unavailable={unavailable}
          />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">الإحصائيات</h2>
          <StatisticsPanel stats={localStats} />
        </section>

        <section>
          <ExportSection available={available} onClear={handleClear} />
        </section>
      </main>

      <footer className="border-t py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground space-y-2">
          <p>استخدم هذه الأداة بمسؤولية واحترم شروط خدمة Discord</p>
          <p className="font-medium">تم الصنع بواسطة b9r2</p>
        </div>
      </footer>
    </div>
  );
}