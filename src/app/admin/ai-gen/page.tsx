
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Wand2, Sparkles, Copy, RefreshCw, Send, BrainCircuit, GraduationCap } from "lucide-react";
import { generateEducationalPrompt } from "@/ai/flows/generate-educational-prompts";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AIGenerator() {
  const [topic, setTopic] = useState("");
  const [type, setType] = useState<"fact" | "question" | "both">("both");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ content: string; category: string } | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic) {
      toast({ title: "Topic Required", description: "Please enter a topic to generate content.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const output = await generateEducationalPrompt({ topic, type });
      setResult(output);
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate prompt. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.content);
      toast({ title: "Copied!", description: "Content copied to clipboard." });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-accent" />
          Educational AI Prompt Generator
        </h1>
        <p className="text-muted-foreground mt-2">
          Harness AI to create engaging science and math micro-learnings for your displays.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Panel */}
        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Define the scope and format of your content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Learning Topic</Label>
              <Input 
                id="topic" 
                placeholder="e.g. Photosynthesis, Prime Numbers, Solar System" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Content Format</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Choose format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fact">Curiosity Fact</SelectItem>
                  <SelectItem value="question">Thought-provoking Question</SelectItem>
                  <SelectItem value="both">AI Choice (Most engaging)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border border-dashed text-xs text-muted-foreground">
              <p>AI will optimize the content for digital signage: brief, high-impact, and highly readable from a distance.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-primary h-12 text-lg gap-2" 
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? <RefreshCw className="animate-spin" /> : <Sparkles />}
              Generate Prompt
            </Button>
          </CardFooter>
        </Card>

        {/* Output Panel */}
        <Card className="flex flex-col shadow-lg border-accent/20 bg-gradient-to-br from-white to-accent/5">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Generated Result
              {result && (
                <Badge variant="outline" className="bg-white">
                  {result.category}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center text-center p-8">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
                <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                <div className="h-4 bg-muted rounded w-5/6 mx-auto" />
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div className="relative">
                  <GraduationCap className="absolute -top-6 -left-6 text-accent/20 w-16 h-16 -z-0" />
                  <p className="text-2xl font-semibold leading-tight text-primary relative z-10 italic">
                    "{result.content}"
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  <Button variant="secondary" size="sm" onClick={copyToClipboard} className="gap-2">
                    <Copy className="w-4 h-4" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 text-primary">
                    <Send className="w-4 h-4" /> Push to Playlist
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-4 py-12">
                <Wand2 className="w-12 h-12 opacity-20" />
                <p>Configure and generate to see results.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-white/50 border-t py-4 text-xs text-muted-foreground">
            History: 12 prompts generated today.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
