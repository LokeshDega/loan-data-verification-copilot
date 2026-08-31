"use client"

import React from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';

export default function SummaryPage() {
  const { summaryData } = useWorkspace();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
        <h3 className="text-lg font-bold text-foreground mb-4">Exceptions Distribution by Type</h3>
        {summaryData?.exceptionsByType && Object.keys(summaryData.exceptionsByType).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(summaryData.exceptionsByType).map(([type, count]) => (
              <div key={type} className="space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">{type}</span>
                  <span className="text-muted-foreground">{Number(count)} items</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-amber-500" 
                    style={{ width: `${Math.min(100, (Number(count) / (summaryData.totalLoans || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">No active exceptions found.</p>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
        <h3 className="text-lg font-bold text-foreground mb-4">Exceptions by Severity</h3>
        {summaryData?.exceptionsBySeverity && Object.keys(summaryData.exceptionsBySeverity).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(summaryData.exceptionsBySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between text-sm p-3.5 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    severity === 'HIGH' ? 'bg-rose-500' : severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <span className="font-bold text-foreground uppercase">{severity} Severity</span>
                </div>
                <span className="font-extrabold text-foreground">{Number(count)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">No exceptions recorded.</p>
        )}
      </div>
    </div>
  );
}
