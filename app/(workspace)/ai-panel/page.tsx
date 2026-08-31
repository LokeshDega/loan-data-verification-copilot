"use client"

import React from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { IconSparkles, IconRefresh, IconFileText } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function AiPanelPage() {
  const {
    naturalRuleInput,
    setNaturalRuleInput,
    generatingRule,
    generatedRuleResult,
    generateValidationRuleFromText
  } = useWorkspace();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
      {/* Left panel: input rules */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4 h-fit">
        <div className="flex items-center gap-2">
          <IconSparkles className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="text-lg font-bold text-foreground">Natural Language Validation Rule Generator</h3>
        </div>
        
        <p className="text-xs text-muted-foreground leading-relaxed">
          Translate business guidelines or loan guidelines into structured validation rules and TypeScript unit test cases instantly using AI.
        </p>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-muted-foreground uppercase">
            Describe business validation rule
          </label>
          <textarea
            value={naturalRuleInput}
            onChange={(e) => setNaturalRuleInput(e.target.value)}
            placeholder="Example: Interest rate on ARM (Adjustable Rate Mortgage) loans must not exceed 9.5% if borrower state is NY."
            className="w-full bg-muted/40 border border-border rounded-lg p-3 text-sm font-medium text-foreground focus:outline-hidden focus:border-primary/60 min-h-[100px]"
          />
        </div>

        <button
          onClick={generateValidationRuleFromText}
          disabled={generatingRule || !naturalRuleInput.trim()}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/95 disabled:bg-primary/50 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm duration-100"
        >
          {generatingRule && <IconRefresh className="h-3.5 w-3.5 animate-spin" />}
          Generate Validation Rule & Tests
        </button>
      </div>

      {/* Right panel: generated output */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider text-muted-foreground">Generated Output</h3>
        
        {!generatedRuleResult && !generatingRule ? (
          <div className="h-60 border-2 border-dashed border-border/80 rounded-xl flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <IconSparkles className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <span className="text-xs font-semibold">Enter a rule on the left and trigger generation to see structured schemas and unit tests.</span>
          </div>
        ) : generatingRule ? (
          <div className="h-60 flex flex-col items-center justify-center text-center gap-3">
            <IconRefresh className="h-8 w-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground font-semibold">AI is drafting JSON configurations and test scripts...</span>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-xs leading-relaxed bg-muted/40 border border-border p-3.5 rounded-lg text-foreground">
              <strong className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">AI Logic Explanation:</strong>
              {generatedRuleResult.explanation}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold">
                <span>JSON Config (validation_rules.json)</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(generatedRuleResult.jsonRule, null, 2));
                    toast.success('Copied JSON rule config to clipboard!');
                  }}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Copy Config
                </button>
              </div>
              <pre className="text-[10px] bg-muted/60 border border-border p-3 rounded-lg font-mono text-foreground overflow-x-auto max-h-[120px]">
                {JSON.stringify(generatedRuleResult.jsonRule, null, 2)}
              </pre>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold">
                <span>TypeScript Test Spec (validate.test.ts)</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedRuleResult.testCode);
                    toast.success('Copied TypeScript unit test to clipboard!');
                  }}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Copy Test Case
                </button>
              </div>
              <pre className="text-[9px] bg-muted/60 border border-border p-3 rounded-lg font-mono text-foreground overflow-x-auto max-h-[160px] whitespace-pre-wrap">
                {generatedRuleResult.testCode}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
