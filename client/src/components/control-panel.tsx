import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Square, Settings, Timer, Shield } from "lucide-react";
import type { CheckSettings } from "@shared/schema";

interface ControlPanelProps {
  settings: CheckSettings;
  onSettingsChange: (settings: CheckSettings) => void;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  checksToday: number;
}

export function ControlPanel({
  settings,
  onSettingsChange,
  isRunning,
  onStart,
  onStop,
  checksToday,
}: ControlPanelProps) {
  const handleTypeToggle = (type: "three" | "four" | "semiThree") => {
    const types = settings.usernameTypes.includes(type)
      ? settings.usernameTypes.filter((t) => t !== type)
      : [...settings.usernameTypes, type];
    if (types.length > 0) {
      onSettingsChange({ ...settings, usernameTypes: types });
    }
  };

  const typeLabels = {
    three: "ثلاثي",
    four: "رباعي",
    semiThree: "شبه ثلاثي",
  };

  const remainingChecks = settings.dailyLimit - checksToday;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            إعدادات التوليد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">نوع الاسم</Label>
            <div className="flex flex-wrap gap-2">
              {(["three", "four", "semiThree"] as const).map((type) => (
                <Badge
                  key={type}
                  variant={settings.usernameTypes.includes(type) ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2 text-sm toggle-elevate"
                  onClick={() => handleTypeToggle(type)}
                  data-testid={`badge-type-${type}`}
                >
                  {typeLabels[type]}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              ثلاثي: abc أو ab1 | رباعي: abcd | شبه ثلاثي: a_bc أو a.bc
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              ⚠️ بدون بروكسيات، Discord API سيحظر طلباتك بسرعة. أضف بروكسيات في check_username.py للحصول على نتائج أفضل.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">محتوى الاسم</Label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="letters"
                  checked={settings.includeLetters}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ ...settings, includeLetters: !!checked })
                  }
                  data-testid="checkbox-letters"
                />
                <Label htmlFor="letters" className="cursor-pointer">
                  تضمين الأحرف (a-z)
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="numbers"
                  checked={settings.includeNumbers}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ ...settings, includeNumbers: !!checked })
                  }
                  data-testid="checkbox-numbers"
                />
                <Label htmlFor="numbers" className="cursor-pointer">
                  تضمين الأرقام (0-9)
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            حماية من الحظر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Timer className="h-4 w-4" />
                التأخير بين الطلبات
              </Label>
              <Badge variant="secondary" className="font-mono">
                {(settings.delayMs / 1000).toFixed(1)} ثانية
              </Badge>
            </div>
            <Slider
              value={[settings.delayMs]}
              onValueChange={([value]) =>
                onSettingsChange({ ...settings, delayMs: value })
              }
              min={5000}
              max={15000}
              step={1000}
              className="w-full"
              data-testid="slider-delay"
            />
            <p className="text-sm text-muted-foreground">
              تأخير أعلى = حماية أفضل من الحظر
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-base font-medium">الحد اليومي</Label>
              <Badge variant="secondary" className="font-mono">
                {settings.dailyLimit} فحص
              </Badge>
            </div>
            <Slider
              value={[settings.dailyLimit]}
              onValueChange={([value]) =>
                onSettingsChange({ ...settings, dailyLimit: value })
              }
              min={10}
              max={500}
              step={10}
              className="w-full"
              data-testid="slider-daily-limit"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">المتبقي اليوم:</span>
              <span className={remainingChecks <= 10 ? "text-destructive font-medium" : "text-muted-foreground"}>
                {remainingChecks} فحص
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold"
          variant={isRunning ? "destructive" : "default"}
          onClick={isRunning ? onStop : onStart}
          disabled={remainingChecks <= 0 || (!settings.includeLetters && !settings.includeNumbers)}
          data-testid="button-start-stop"
        >
          {isRunning ? (
            <>
              <Square className="h-5 w-5 ml-2" />
              إيقاف الفحص
            </>
          ) : (
            <>
              <Play className="h-5 w-5 ml-2" />
              بدء الفحص
            </>
          )}
        </Button>
        {remainingChecks <= 0 && (
          <p className="text-sm text-destructive text-center mt-2">
            لقد وصلت للحد اليومي. حاول مجدداً غداً.
          </p>
        )}
      </div>
    </div>
  );
}