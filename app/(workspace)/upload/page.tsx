"use client"

import React from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { IconUpload, IconRefresh, IconFileText, IconDownload } from '@tabler/icons-react';

export default function UploadPage() {
  const {
    uploading,
    selectedUploadType,
    setSelectedUploadType,
    fileInputRef,
    handleFileUpload
  } = useWorkspace();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      {/* Left Column: Upload Console */}
      <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-xs">
        <h3 className="text-lg font-bold text-foreground mb-4">Ingest Inbound Loan Documents</h3>
        
        {/* Select upload type */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {(['LOAN_TAPE', 'SERVICER_UPDATE', 'DOCUMENT_MANIFEST'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedUploadType(type)}
              className={`py-2 px-3 text-xs font-bold rounded-lg border transition duration-100 cursor-pointer ${
                selectedUploadType === type
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {type === 'LOAN_TAPE' && 'Loan Tape CSV'}
              {type === 'SERVICER_UPDATE' && 'Servicer Updates'}
              {type === 'DOCUMENT_MANIFEST' && 'Doc Manifest'}
            </button>
          ))}
        </div>

        {/* Dropzone */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/10 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition duration-150"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv"
            className="hidden" 
          />
          
          {uploading === selectedUploadType ? (
            <div className="flex flex-col items-center gap-3">
              <IconRefresh className="h-10 w-10 text-primary animate-spin" />
              <span className="text-sm font-semibold text-foreground">Processing file...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <IconUpload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Click to upload CSV File</p>
                <p className="text-xs text-muted-foreground mt-1">Upload files to populate the validation pipelines</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Download Test Files */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs h-fit">
        <div className="flex items-center gap-2 mb-4">
          <IconFileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Synthetic Demo Datasets</h3>
        </div>
        
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          Download synthetic datasets pre-packaged with anomalies for easy testing of validation rules.
        </p>

        <div className="space-y-2">
          <a 
            href="/data/loan_tape.csv" 
            download 
            className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/70 hover:border-primary/40 duration-100 text-xs font-semibold text-foreground cursor-pointer"
          >
            <span>1. Loan Tape (loan_tape.csv)</span>
            <IconDownload className="h-3.5 w-3.5 text-primary" />
          </a>
          <a 
            href="/data/servicer_update.csv" 
            download 
            className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/70 hover:border-primary/40 duration-100 text-xs font-semibold text-foreground cursor-pointer"
          >
            <span>2. Servicer (servicer_update.csv)</span>
            <IconDownload className="h-3.5 w-3.5 text-primary" />
          </a>
          <a 
            href="/data/document_manifest.csv" 
            download 
            className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/70 hover:border-primary/40 duration-100 text-xs font-semibold text-foreground cursor-pointer"
          >
            <span>3. Manifest (document_manifest.csv)</span>
            <IconDownload className="h-3.5 w-3.5 text-primary" />
          </a>
        </div>
      </div>
    </div>
  );
}
