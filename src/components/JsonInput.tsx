import { useState, useCallback } from "react";
import { Code, Upload, Loader2, FileJson } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JsonInputProps {
  onJsonSubmit: (json: string) => void;
  isLoading?: boolean;
  className?: string;
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
      // Accept both array and single object
      const dataToSubmit = Array.isArray(parsed) ? trimmedText : JSON.stringify([parsed]);
      onJsonSubmit(dataToSubmit);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setError(`Invalid JSON: ${errorMessage}`);
    }
  }, [jsonText, onJsonSubmit]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      setError("Please upload a JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setJsonText(text);
      setError(null);
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
          "relative border-2 border-dashed rounded-xl p-4 transition-all duration-300",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50",
          isLoading && "pointer-events-none opacity-60"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex items-center gap-2 mb-3">
          <FileJson className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">
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
              Browse file
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
  "profitTotal": { "profit": 68.34, "loss": -92.17, ... },
  ...
}]`}
          className="min-h-[200px] font-mono text-xs bg-muted/50 border-0 resize-none"
          disabled={isLoading}
        />

        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}
      </div>

      <Button
        onClick={validateAndSubmit}
        disabled={isLoading || !jsonText.trim()}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Code className="w-4 h-4 mr-2" />
            Analyze JSON Data
          </>
        )}
      </Button>
    </div>
  );
}
