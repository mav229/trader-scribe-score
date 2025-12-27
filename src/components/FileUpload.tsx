import { useCallback, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File, text: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function FileUpload({ onFileSelect, isLoading, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      onFileSelect(file, base64);
    };
    reader.readAsArrayBuffer(file);
  }, [onFileSelect]);

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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      className={cn(
        "relative rounded-xl p-10 transition-all duration-300",
        "flex flex-col items-center justify-center gap-5 cursor-pointer",
        "bg-card border border-border/50",
        isDragging 
          ? "border-primary/50 bg-primary/5 scale-[1.01]" 
          : "hover:border-border hover:bg-card/80",
        isLoading && "pointer-events-none opacity-60",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !isLoading && document.getElementById('pdf-input')?.click()}
    >
      <input
        id="pdf-input"
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleInputChange}
        className="hidden"
        disabled={isLoading}
      />

      {isLoading ? (
        <>
          <div className="relative">
            <div className="absolute -inset-3 bg-primary/20 rounded-full blur-lg animate-pulse" />
            <Loader2 className="w-10 h-10 text-primary animate-spin relative" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-foreground text-sm font-medium">Analyzing report...</p>
            <p className="text-xs text-muted-foreground mt-1">Extracting metrics and calculating score</p>
          </div>
        </>
      ) : fileName ? (
        <>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-foreground text-sm font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground mt-1">Click or drop another PDF to replace</p>
          </div>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center">
            <Upload className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-foreground text-sm font-medium">Drop your MT5 report here</p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse (PDF only)</p>
          </div>
        </>
      )}
    </div>
  );
}