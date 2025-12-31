import Editor from '@monaco-editor/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Check, Lightbulb, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  initialCode?: string;
  solution?: string | null;
  hints?: string[] | null;
  language?: string;
  onRun?: (code: string) => void;
}

export function CodeEditor({ 
  initialCode = '# Write your solution here\n\ndef solution():\n    pass\n', 
  solution, 
  hints,
  language = 'python',
  onRun 
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>('');
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);

  const handleRun = () => {
    setOutput('Running code...\n\n(Note: Code execution is simulated. In production, this would connect to a code execution service.)');
    onRun?.(code);
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput('');
  };

  const handleShowHint = () => {
    if (!showHints) {
      setShowHints(true);
      setCurrentHint(0);
    } else if (hints && currentHint < hints.length - 1) {
      setCurrentHint(currentHint + 1);
    }
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/70" />
            <div className="w-3 h-3 rounded-full bg-warning/70" />
            <div className="w-3 h-3 rounded-full bg-success/70" />
          </div>
          <span className="text-sm text-muted-foreground ml-2">solution.py</span>
        </div>
        <div className="flex items-center gap-2">
          {hints && hints.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShowHint}
              className="text-warning hover:text-warning"
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              Hint {showHints ? `(${currentHint + 1}/${hints.length})` : ''}
            </Button>
          )}
          {solution && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSolution(!showSolution)}
            >
              {showSolution ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showSolution ? 'Hide' : 'Show'} Solution
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <Button size="sm" onClick={handleRun} className="bg-success hover:bg-success/90">
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>
        </div>
      </div>

      {/* Hints panel */}
      {showHints && hints && (
        <div className="px-4 py-3 bg-warning/10 border-b border-warning/20">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-warning">Hint {currentHint + 1}</p>
              <p className="text-sm text-foreground">{hints[currentHint]}</p>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
        <div className={cn("min-h-[300px]", showSolution && "lg:col-span-1")}>
          <Editor
            height="300px"
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
            }}
          />
        </div>

        {/* Solution panel */}
        {showSolution && solution && (
          <div className="min-h-[300px] bg-success/5">
            <div className="px-4 py-2 bg-success/10 border-b border-success/20 flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">Solution</span>
            </div>
            <Editor
              height="268px"
              language={language}
              value={solution}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
              }}
            />
          </div>
        )}
      </div>

      {/* Output */}
      {output && (
        <div className="border-t border-border">
          <div className="px-4 py-2 bg-secondary/30 border-b border-border">
            <span className="text-sm font-medium">Output</span>
          </div>
          <pre className="p-4 text-sm font-mono text-muted-foreground whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
