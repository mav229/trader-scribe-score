import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ScholarScore } from "@/components/ScholarScore";
import { PillarScores } from "@/components/PillarScores";
import { ExtractedMetrics } from "@/components/ExtractedMetrics";
import { parseMT5Report, type ScoringResult } from "@/lib/mt5-parser";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (_file: File, pdfText: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const scoringResult = await parseMT5Report(pdfText);
      setResult(scoringResult);
      toast({
        title: "Analysis Complete",
        description: `Scholar Score: ${scoringResult.finalScholarScore} (Grade ${scoringResult.grade})`,
      });
    } catch (error) {
      console.error("Parse error:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to parse report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            MT5 <span className="text-primary">Scholar Score</span>
          </h1>
          <p className="text-muted-foreground">
            Upload your MetaTrader 5 trading report for instant analysis
          </p>
        </header>

        {/* Upload */}
        <FileUpload 
          onFileSelect={handleFileSelect} 
          isLoading={isLoading}
          className="mb-12 max-w-xl mx-auto"
        />

        {/* Results */}
        {result && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <ScholarScore 
                score={result.finalScholarScore} 
                grade={result.grade}
                className="mx-auto lg:mx-0"
              />
              <PillarScores 
                scores={result.pillarScores}
                className="flex-1 w-full"
              />
            </div>

            <div className="border-t border-border pt-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">Extracted Metrics</h2>
              <ExtractedMetrics data={result.extractedData} />
            </div>

            {/* Raw JSON */}
            <details className="border border-border rounded-lg overflow-hidden">
              <summary className="px-4 py-3 bg-card cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                View Raw JSON Output
              </summary>
              <pre className="p-4 bg-muted text-xs overflow-auto max-h-96 font-mono">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
