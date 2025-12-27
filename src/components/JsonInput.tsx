import { useState, useCallback } from "react";
import { Code, Loader2, FileJson } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JsonInputProps {
  onJsonSubmit: (json: string) => void;
  isLoading?: boolean;
  className?: string;
}

function sanitizeJson(text: string): string {
  let sanitized = text.trim();
  sanitized = sanitized.replace(/,(\s*[}\]])/g, '$1');
  if (sanitized.startsWith('{') && !sanitized.startsWith('[')) {
    sanitized = '[' + sanitized + ']';
  }
  return sanitized;
}

function extractFirstObject(text: string): string | null {
  const trimmed = text.trim();
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;
  
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    
    if (escape) { escape = false; continue; }
    if (char === '\\') { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;
    
    if (char === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const obj = trimmed.substring(start, i + 1);
        try {
          JSON.parse(obj);
          return '[' + obj + ']';
        } catch { /* Continue */ }
      }
    }
  }
  
  return null;
}

export function JsonInput({ onJsonSubmit, isLoading, className }: JsonInputProps) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateAndSubmit = useCallback(() => {
    setError(null);
    const trimmedText = jsonText.trim();
    
    if (!trimmedText) {
      setError("Please paste JSON data");
      return;
    }

    try {
      const parsed = JSON.parse(trimmedText);
      const dataToSubmit = Array.isArray(parsed) ? trimmedText : JSON.stringify([parsed]);
      onJsonSubmit(dataToSubmit);
      return;
    } catch { /* Try sanitizing */ }

    try {
      const sanitized = sanitizeJson(trimmedText);
      const parsed = JSON.parse(sanitized);
      const dataToSubmit = Array.isArray(parsed) ? sanitized : JSON.stringify([parsed]);
      onJsonSubmit(dataToSubmit);
      return;
    } catch { /* Try extracting */ }

    const firstObject = extractFirstObject(trimmedText);
    if (firstObject) {
      onJsonSubmit(firstObject);
      return;
    }

    setError("Could not parse JSON. Make sure it contains complete trading data objects.");
  }, [jsonText, onJsonSubmit]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError("Please upload a JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      
      try {
        JSON.parse(text);
        setJsonText(text);
        setError(null);
        return;
      } catch { /* File might be incomplete */ }

      const firstObject = extractFirstObject(text);
      if (firstObject) {
        setJsonText(firstObject);
        setError(null);
        return;
      }

      setJsonText(text);
      setError("JSON file appears incomplete. Will try to extract usable data.");
    };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative rounded-xl p-5 transition-all duration-300",
          "bg-card border border-border/50",
          isDragging 
            ? "border-primary/50 bg-primary/5" 
            : "hover:border-border",
          isLoading && "pointer-events-none opacity-60"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
            <FileJson className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <span className="text-xs text-muted-foreground">
            Paste JSON or drop a .json file
          </span>
          <label className="ml-auto">
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileInput}
              className="hidden"
              disabled={isLoading}
            />
            <span className="text-xs text-primary hover:underline cursor-pointer">
              Browse
            </span>
          </label>
        </div>

        <Textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setError(null);
          }}
          placeholder={`Paste your trading data JSON here...

Example format:
[{
  "balance": { "balance": 1933.17, ... },
  "growth": { "drawdown": 0.021492, ... },
  "profitTotal": { "profit": 68.34, ... }
}]`}
          className="min-h-[160px] font-mono text-xs bg-muted/30 border-border/50 resize-none placeholder:text-muted-foreground/50"
          disabled={isLoading}
        />

        {error && (
          <p className="text-xs text-destructive mt-3">{error}</p>
        )}
      </div>

      <Button
        onClick={validateAndSubmit}
        disabled={isLoading || !jsonText.trim()}
        className="w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/30"
        variant="ghost"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Code className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Analyze JSON Data
          </>
        )}
      </Button>
    </div>
  );
}