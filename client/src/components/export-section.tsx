import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Trash2, FileText, FileJson, FileSpreadsheet, ChevronDown } from "lucide-react";
import type { UsernameCheck } from "@shared/schema";

type ExportFormat = "txt" | "json" | "csv";

interface ExportSectionProps {
  available: UsernameCheck[];
  onClear: () => void;
}

export function ExportSection({ available, onClear }: ExportSectionProps) {
  const getDateString = () => new Date().toISOString().split("T")[0];

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsTxt = () => {
    if (available.length === 0) return;
    const content = available.map((check) => check.username).join("\n");
    downloadFile(content, `discord-usernames-${getDateString()}.txt`, "text/plain");
  };

  const exportAsJson = () => {
    if (available.length === 0) return;
    const data = available.map((check) => ({
      username: check.username,
      type: check.type,
      checkedAt: check.checkedAt,
    }));
    const content = JSON.stringify(data, null, 2);
    downloadFile(content, `discord-usernames-${getDateString()}.json`, "application/json");
  };

  const exportAsCsv = () => {
    if (available.length === 0) return;
    const headers = "اسم المستخدم,النوع,وقت الفحص";
    const typeLabels: Record<string, string> = {
      three: "ثلاثي",
      four: "رباعي",
      semiThree: "شبه ثلاثي",
    };
    const rows = available.map((check) => {
      const type = typeLabels[check.type] || check.type;
      const date = check.checkedAt ? new Date(check.checkedAt).toLocaleString("ar-SA") : "";
      return `${check.username},${type},${date}`;
    });
    const content = [headers, ...rows].join("\n");
    downloadFile(content, `discord-usernames-${getDateString()}.csv`, "text/csv");
  };

  const handleExport = (format: ExportFormat) => {
    switch (format) {
      case "txt":
        exportAsTxt();
        break;
      case "json":
        exportAsJson();
        break;
      case "csv":
        exportAsCsv();
        break;
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="text-sm text-muted-foreground">
        {available.length > 0 && (
          <span>تم العثور على {available.length} اسم متاح</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              disabled={available.length === 0}
              data-testid="button-export"
            >
              <Download className="h-4 w-4 ml-2" />
              تصدير النتائج
              <ChevronDown className="h-4 w-4 mr-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleExport("txt"); }} data-testid="export-txt">
              <FileText className="h-4 w-4 ml-2" />
              ملف نصي (TXT)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleExport("json"); }} data-testid="export-json">
              <FileJson className="h-4 w-4 ml-2" />
              ملف JSON
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleExport("csv"); }} data-testid="export-csv">
              <FileSpreadsheet className="h-4 w-4 ml-2" />
              جدول بيانات (CSV)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          onClick={onClear}
          data-testid="button-clear"
        >
          <Trash2 className="h-4 w-4 ml-2" />
          مسح الكل
        </Button>
      </div>
    </div>
  );
}
