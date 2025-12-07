import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Loader2, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { UsernameCheck } from "@shared/schema";

interface ResultsDisplayProps {
  queue: UsernameCheck[];
  available: UsernameCheck[];
  unavailable: UsernameCheck[];
}

const typeLabels: Record<string, string> = {
  three: "3L",
  four: "4L",
  semiThree: "~3L",
};

function UsernameItem({
  check,
  showCopy = false,
}: {
  check: UsernameCheck;
  showCopy?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(check.username);
    setCopied(true);
    toast({
      title: "تم النسخ",
      description: `تم نسخ "${check.username}" إلى الحافظة`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/50">
      <div className="flex items-center gap-3">
        <span className="font-mono text-base font-medium" dir="ltr">
          {check.username}
        </span>
        <Badge variant="outline" size="sm">
          {typeLabels[check.type]}
        </Badge>
      </div>
      {showCopy && (
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCopy}
          data-testid={`button-copy-${check.username}`}
        >
          {copied ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      )}
      {check.status === "checking" && (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      )}
    </div>
  );
}

function EmptyState({ type }: { type: "queue" | "available" | "unavailable" }) {
  const messages = {
    queue: "لا توجد أسماء في الانتظار",
    available: "لم يتم العثور على أسماء متاحة بعد",
    unavailable: "لم يتم فحص أي اسم بعد",
  };

  const icons = {
    queue: <Loader2 className="h-8 w-8 text-muted-foreground/50" />,
    available: <Check className="h-8 w-8 text-muted-foreground/50" />,
    unavailable: <X className="h-8 w-8 text-muted-foreground/50" />,
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icons[type]}
      <p className="mt-3 text-sm text-muted-foreground">{messages[type]}</p>
    </div>
  );
}

export function ResultsDisplay({
  queue,
  available,
  unavailable,
}: ResultsDisplayProps) {
  return (
    <>
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4" />
                قيد الفحص
              </span>
              <Badge variant="secondary">{queue.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {queue.length === 0 ? (
                <EmptyState type="queue" />
              ) : (
                <div className="space-y-2">
                  {queue.map((check) => (
                    <UsernameItem key={check.id} check={check} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 dark:border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <Check className="h-4 w-4" />
                متاح
              </span>
              <Badge className="bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/30">
                {available.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {available.length === 0 ? (
                <EmptyState type="available" />
              ) : (
                <div className="space-y-2">
                  {available.map((check) => (
                    <UsernameItem key={check.id} check={check} showCopy />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 dark:border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2 text-red-600 dark:text-red-500">
                <X className="h-4 w-4" />
                غير متاح
              </span>
              <Badge className="bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/30">
                {unavailable.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {unavailable.length === 0 ? (
                <EmptyState type="unavailable" />
              ) : (
                <div className="space-y-2">
                  {unavailable.map((check) => (
                    <UsernameItem key={check.id} check={check} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="lg:hidden">
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="queue" className="gap-1" data-testid="tab-queue">
              <Loader2 className="h-3 w-3" />
              <span className="hidden sm:inline">قيد الفحص</span>
              <Badge variant="secondary" size="sm">{queue.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="available" className="gap-1" data-testid="tab-available">
              <Check className="h-3 w-3" />
              <span className="hidden sm:inline">متاح</span>
              <Badge variant="secondary" size="sm">{available.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unavailable" className="gap-1" data-testid="tab-unavailable">
              <X className="h-3 w-3" />
              <span className="hidden sm:inline">غير متاح</span>
              <Badge variant="secondary" size="sm">{unavailable.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="queue" className="mt-4">
            <Card>
              <CardContent className="pt-4">
                <ScrollArea className="h-[300px]">
                  {queue.length === 0 ? (
                    <EmptyState type="queue" />
                  ) : (
                    <div className="space-y-2">
                      {queue.map((check) => (
                        <UsernameItem key={check.id} check={check} />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="available" className="mt-4">
            <Card className="border-green-500/30 dark:border-green-500/20">
              <CardContent className="pt-4">
                <ScrollArea className="h-[300px]">
                  {available.length === 0 ? (
                    <EmptyState type="available" />
                  ) : (
                    <div className="space-y-2">
                      {available.map((check) => (
                        <UsernameItem key={check.id} check={check} showCopy />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="unavailable" className="mt-4">
            <Card className="border-red-500/30 dark:border-red-500/20">
              <CardContent className="pt-4">
                <ScrollArea className="h-[300px]">
                  {unavailable.length === 0 ? (
                    <EmptyState type="unavailable" />
                  ) : (
                    <div className="space-y-2">
                      {unavailable.map((check) => (
                        <UsernameItem key={check.id} check={check} />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
