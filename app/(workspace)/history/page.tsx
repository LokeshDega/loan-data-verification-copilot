"use client"

import React from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';

export default function HistoryPage() {
  const { summaryData } = useWorkspace();

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-xs animate-in fade-in duration-200">
      <h3 className="text-lg font-bold text-foreground mb-4">Ingestion Activity & History</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border text-muted-foreground font-semibold">
              <th className="py-2.5">File Name</th>
              <th className="py-2.5">Source Type</th>
              <th className="py-2.5">Timestamp</th>
              <th className="py-2.5">Row Count</th>
              <th className="py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {summaryData?.uploadHistory?.length > 0 ? (
              summaryData.uploadHistory.map((up: any) => (
                <tr key={up.id} className="border-b border-border/60 hover:bg-muted/20">
                  <td className="py-3 font-medium text-foreground">{up.filename}</td>
                  <td className="py-3 text-xs font-mono">{up.sourceType}</td>
                  <td className="py-3 text-muted-foreground text-xs">
                    {new Date(up.uploadedAt).toLocaleString()}
                  </td>
                  <td className="py-3 font-semibold text-foreground">{up.rowCount}</td>
                  <td className="py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      up.status === 'PROCESSED' 
                        ? 'bg-emerald-500/10 text-emerald-600' 
                        : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      {up.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No ingestion files processed yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
