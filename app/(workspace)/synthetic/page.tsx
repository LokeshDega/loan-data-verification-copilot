"use client"

import React from 'react';
import { IconFileText, IconDownload } from '@tabler/icons-react';

export default function SyntheticPage() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-xs animate-in fade-in duration-200">
      <div className="flex items-center gap-2 mb-4">
        <IconFileText className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Synthetic Demo Datasets</h3>
      </div>
      
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        To make testing easier, we have generated synthetic data tapes mimicking real loan-level data, embedded with common validation anomalies (e.g. invalid interest rates, mismatched maturities, missing IDs).
      </p>

      <div className="space-y-2 max-w-md">
        <a 
          href="/data/loan_tape.csv" 
          download 
          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/70 hover:border-primary/40 duration-100 text-sm font-semibold text-foreground cursor-pointer"
        >
          <span>1. Primary Loan Tape (loan_tape.csv)</span>
          <IconDownload className="h-4 w-4 text-primary" />
        </a>
        <a 
          href="/data/servicer_update.csv" 
          download 
          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/70 hover:border-primary/40 duration-100 text-sm font-semibold text-foreground cursor-pointer"
        >
          <span>2. Servicer Updates (servicer_update.csv)</span>
          <IconDownload className="h-4 w-4 text-primary" />
        </a>
        <a 
          href="/data/document_manifest.csv" 
          download 
          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/70 hover:border-primary/40 duration-100 text-sm font-semibold text-foreground cursor-pointer"
        >
          <span>3. Doc Manifest (document_manifest.csv)</span>
          <IconDownload className="h-4 w-4 text-primary" />
        </a>
      </div>
    </div>
  );
}
