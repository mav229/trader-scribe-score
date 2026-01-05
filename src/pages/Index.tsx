import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { JsonInput } from "@/components/JsonInput";
import { ScholarScore } from "@/components/ScholarScore";
import { RadarChart } from "@/components/RadarChart";
import { ExtractedMetrics } from "@/components/ExtractedMetrics";
import { parseMT5Report, parseJsonData, type ScoringResult } from "@/lib/mt5-parser";
import { generateScholarScoreSpecPDF } from "@/lib/scholar-score-pdf";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Code, Download, GraduationCap } from "lucide-react";

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
        description: `Scholar Score: ${scoringResult.finalScholarScore}`,
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

  const handleJsonSubmit = async (jsonText: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const scoringResult = await parseJsonData(jsonText);
      setResult(scoringResult);
      toast({
        title: "Analysis Complete",
        description: `Scholar Score: ${scoringResult.finalScholarScore}`,
      });
    } catch (error) {
      console.error("Parse error:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to parse JSON data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Compute radar chart data from pillar scores (normalize to 0-100)
  const getRadarData = () => {
    if (!result) return { consistency: 0, slUsage: 0, winRate: 0, riskReward: 0 };
    const { pillarScores } = result;
    return {
      consistency: (pillarScores.consistency / 20) * 100,
      slUsage: (pillarScores.capitalProtection / 30) * 100,
      winRate: (pillarScores.profitability / 25) * 100,
      riskReward: (pillarScores.tradeManagement / 25) * 100,
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-16 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute -inset-2 bg-primary/20 rounded-full blur-lg animate-pulse-glow" />
              <GraduationCap className="w-10 h-10 text-primary relative" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">
              Scholar<span className="text-primary font-medium">Score</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
            Upload your MetaTrader 5 trading report for instant performance analysis
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={generateScholarScoreSpecPDF}
            className="gap-2 text-xs border-border/50 text-muted-foreground hover:text-foreground"
          >
            <Download className="w-3.5 h-3.5" />
            Technical Specification
          </Button>
        </header>

        {/* Input Tabs */}
        <div className="max-w-lg mx-auto mb-16">
          <Tabs defaultValue="pdf">
            <TabsList className="grid w-full grid-cols-2 bg-muted/30 border border-border/50">
              <TabsTrigger 
                value="pdf" 
                className="gap-2 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground"
              >
                <FileText className="w-4 h-4" />
                PDF Report
              </TabsTrigger>
              <TabsTrigger 
                value="json" 
                className="gap-2 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground"
              >
                <Code className="w-4 h-4" />
                JSON Data
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pdf" className="mt-6">
              <FileUpload 
                onFileSelect={handleFileSelect} 
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="json" className="mt-6">
              <JsonInput
                onJsonSubmit={handleJsonSubmit}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-12 animate-fade-in">
            {/* Score + Radar Chart */}
            <div className="p-5 rounded-xl bg-card border border-border/50 card-glow w-fit">
              <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
                <ScholarScore 
                  score={result.finalScholarScore} 
                  grade={result.grade}
                  className="scale-75 origin-center"
                />
                <RadarChart data={getRadarData()} size={140} />
              </div>
            </div>

            {/* Metrics */}
            <div>
              <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-primary mb-6">
                Extracted Metrics
              </h2>
              <ExtractedMetrics data={result.extractedData} />
            </div>

            {/* Raw JSON */}
            <details className="rounded-xl border border-border/50 overflow-hidden bg-card">
              <summary className="px-5 py-4 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                View Raw JSON Output
              </summary>
              <pre className="p-5 bg-muted/30 text-xs overflow-auto max-h-80 font-mono text-muted-foreground border-t border-border/50">
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
