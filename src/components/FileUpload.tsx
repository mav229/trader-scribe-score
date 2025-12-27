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

    // Read as ArrayBuffer for PDF.js or as text for now
    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      // Convert to base64 for the backend
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      
      // For now, we'll pass a representation of the PDF
      // The backend will need to parse it
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
        "relative border-2 border-dashed rounded-xl p-8 transition-all duration-300",
        "flex flex-col items-center justify-center gap-4 cursor-pointer",
        isDragging 
          ? "border-primary bg-primary/5 scale-[1.02]" 
          : "border-border hover:border-primary/50 hover:bg-card/50",
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
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div className="text-center">
            <p className="text-foreground font-medium">Analyzing report...</p>
            <p className="text-sm text-muted-foreground">Extracting metrics and calculating score</p>
          </div>
        </>
      ) : fileName ? (
        <>
          <FileText className="w-12 h-12 text-primary" />
          <div className="text-center">
            <p className="text-foreground font-medium">{fileName}</p>
            <p className="text-sm text-muted-foreground">Click or drop another PDF to replace</p>
          </div>
        </>
      ) : (
        <>
          <Upload className="w-12 h-12 text-muted-foreground" />
          <div className="text-center">
            <p className="text-foreground font-medium">Drop your MT5 report here</p>
            <p className="text-sm text-muted-foreground">or click to browse (PDF only)</p>
          </div>
        </>
      )}
    </div>
  );
}
