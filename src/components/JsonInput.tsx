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

// Helper to sanitize JSON with common issues
function sanitizeJson(text: string): string {
  let sanitized = text.trim();
  
  // Remove trailing commas before } or ]
  sanitized = sanitized.replace(/,(\s*[}\]])/g, '$1');
  
  // If it starts with { but not [, wrap in array
  if (sanitized.startsWith('{') && !sanitized.startsWith('[')) {
    sanitized = '[' + sanitized + ']';
  }
  
  return sanitized;
}

// Extract first complete object from potentially incomplete JSON
function extractFirstObject(text: string): string | null {
  const trimmed = text.trim();
  
  // Find the first complete object
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;
  
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    
    if (escape) {
      escape = false;
      continue;
    }
    
    if (char === '\\') {
      escape = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
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
        } catch {
          // Continue looking
        }
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

    // Try parsing as-is first
    try {
      const parsed = JSON.parse(trimmedText);
      const dataToSubmit = Array.isArray(parsed) ? trimmedText : JSON.stringify([parsed]);
      onJsonSubmit(dataToSubmit);
      return;
    } catch {
      // Try sanitizing
    }

    // Try sanitized version
    try {
      const sanitized = sanitizeJson(trimmedText);
      const parsed = JSON.parse(sanitized);
      const dataToSubmit = Array.isArray(parsed) ? sanitized : JSON.stringify([parsed]);
      onJsonSubmit(dataToSubmit);
      return;
    } catch {
      // Try extracting first object
    }

    // Try extracting just the first complete object
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
      
      // Try to parse and extract usable data
      try {
        const parsed = JSON.parse(text);
        setJsonText(text);
        setError(null);
        return;
      } catch {
        // File might be incomplete, try to extract first object
      }

      const firstObject = extractFirstObject(text);
      if (firstObject) {
        setJsonText(firstObject);
        setError(null);
        return;
      }

      // If all else fails, just load the text and let user see the error
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
