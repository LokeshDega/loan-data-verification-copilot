"use client"

import React from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { IconArrowRight } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function DecisionsPage() {
  const { summaryData, setSelectedLoanId } = useWorkspace();

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-xs animate-in fade-in duration-200">
      <h3 className="text-lg font-bold text-foreground mb-4">Recent Reviewer Decisions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryData?.recentDecisions?.length > 0 ? (
          summaryData.recentDecisions.map((dec: any) => (
            <div 
              key={dec.id} 
              onClick={() => {
                if (dec.loanRecordId) {
                  setSelectedLoanId(dec.loanRecordId);
                } else {
                  toast.warning('No record link available.');
                }
              }}
              className="text-xs p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border space-y-2 cursor-pointer transition-colors duration-150"
            >
              <div className="flex justify-between items-center">
                <span className={`font-bold px-2 py-0.5 rounded-md ${
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
              
              <p className="text-foreground font-semibold font-mono text-[11px] leading-tight">
                Loan ID: {dec.loanId}
              </p>
              <p className="text-muted-foreground font-mono text-[10px] leading-none">
                Borrower: {dec.borrowerId}
              </p>

              {dec.action === 'FIELD_EDIT' && (
                <div className="bg-card border border-border/80 p-2 rounded-md space-y-1 font-mono text-[10px]">
                  <p className="text-muted-foreground">Changed: {dec.details.field}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-rose-500 line-through">{dec.details.oldValue}</span>
                    <IconArrowRight className="h-2.5 w-2.5" />
                    <span className="text-emerald-500">{dec.details.newValue}</span>
                  </div>
                </div>
              )}

              {dec.details?.comment && (
                <p className="text-muted-foreground italic">Note: "{dec.details.comment}"</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-6 col-span-full text-center">
            No review decisions logged yet.
          </p>
        )}
      </div>
    </div>
  );
}
