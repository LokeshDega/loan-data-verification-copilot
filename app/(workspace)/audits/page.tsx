"use client"

import React from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { IconClock, IconArrowRight, IconHash } from '@tabler/icons-react';

export default function AuditsPage() {
  const { summaryData, setSelectedLoanId } = useWorkspace();

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-xs animate-in fade-in duration-200">
      <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
        <IconClock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Global Audit Trail Logs</h3>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {summaryData?.recentDecisions?.length > 0 ? (
          summaryData.recentDecisions.map((dec: any) => (
            <div 
              key={dec.id} 
              onClick={() => { if (dec.loanRecordId) setSelectedLoanId(dec.loanRecordId); }}
              className={`text-xs p-3.5 rounded-xl bg-muted/30 border border-border space-y-2.5 duration-100 ${
                dec.loanRecordId ? 'hover:bg-muted/70 hover:border-primary/40 cursor-pointer' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`font-bold px-2.5 py-0.5 rounded-md ${
                  dec.action === 'APPROVE' 
                    ? 'bg-emerald-500/10 text-emerald-600' 
                    : dec.action === 'REJECT'
                    ? 'bg-rose-500/10 text-rose-600'
                    : 'bg-blue-500/10 text-blue-600'
                }`}>
                  {dec.action}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(dec.timestamp).toLocaleString()}
                </span>
              </div>

              <p className="text-foreground text-sm">
                Loan ID: <strong className="font-semibold">{dec.loanId}</strong> (Borrower: {dec.borrowerId})
              </p>

              {dec.action === 'FIELD_EDIT' && (
                <div className="bg-card border border-border/80 p-2.5 rounded-lg space-y-1 font-mono text-[10px] max-w-sm">
                  <p className="text-muted-foreground text-left">
                    Changed field: <span className="text-foreground font-semibold">{dec.details.field}</span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-rose-500 line-through">{dec.details.oldValue}</span>
                    <IconArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-emerald-500 font-bold">{dec.details.newValue}</span>
                  </div>
                </div>
              )}

              {dec.action === 'APPROVE' && (
                <div className="font-mono text-[10px] text-muted-foreground flex items-center gap-1 bg-card border border-border/80 p-2.5 rounded-lg max-w-md">
                  <IconHash className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Hash: {dec.details.hash}</span>
                </div>
              )}

              {dec.details?.comment && (
                <p className="text-muted-foreground italic">Note: "{dec.details.comment}"</p>
              )}

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/40">
                <span>Actor ID: {dec.user}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">
            No global audit actions logged yet.
          </p>
        )}
      </div>
    </div>
  );
}
