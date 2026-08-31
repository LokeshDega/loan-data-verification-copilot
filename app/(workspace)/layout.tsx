"use client"

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { WorkspaceProvider, useWorkspace } from '@/context/WorkspaceContext';
import { useRole } from '@/context/RoleContext';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/ui/sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  IconBan,
  IconRefresh,
  IconSparkles,
  IconX,
  IconAlertTriangle,
  IconCornerDownRight,
  IconCircleCheck,
  IconDatabase,
  IconClock,
  IconHash,
  IconArrowRight
} from '@tabler/icons-react';
import { toast } from 'sonner';

function WorkspaceLayoutInner({ children }: { children: React.ReactNode }) {
  const { currentRole } = useRole();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const roleRoutes: Record<string, string[]> = {
      OPERATOR: ['/upload', '/history', '/synthetic'],
      REVIEWER: ['/exceptions', '/ai-panel', '/decisions'],
      CONSUMER: ['/verified', '/summary', '/audits']
    };

    const allowed = roleRoutes[currentRole];
    if (allowed && !allowed.includes(pathname)) {
      const defaultPath = currentRole === 'OPERATOR' 
        ? '/upload' 
        : currentRole === 'REVIEWER' 
        ? '/exceptions' 
        : '/verified';
      router.push(defaultPath);
    }
  }, [currentRole, pathname, router]);
  const {
    summaryData,
    loadingSummary,
    setRefreshTrigger,
    resetDatabase,
    selectedLoanId,
    setSelectedLoanId,
    selectedLoanDetail,
    loadingDetail,
    generatingAI,
    aiRecommendation,
    triggerAiCopilot,
    applyAiSuggestions,
    editedFields,
    setEditedFields,
    reviewerNotes,
    setReviewerNotes,
    savingReview,
    saveFieldChanges,
    finalizeReview,
    loanAuditTrail,
    loadingAuditTrail,
    showBatchSummaryModal,
    setShowBatchSummaryModal,
    loadingBatchSummary,
    batchSummaryText,
    selectedBatchIds,
    showConfirmModal,
    setShowConfirmModal,
    confirmTitle,
    confirmMessage,
    confirmAction
  } = useWorkspace();

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "18rem",
        "--header-height": "3.5rem",
      } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <SiteHeader />
        
        <main className="flex-1 min-w-0 p-4 md:p-6 space-y-6">
          
          {/* HEADER SUMMARY SECTION */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/80 pb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground animate-in fade-in duration-100">
                {currentRole === 'OPERATOR' && 'Data Ingestion Desk'}
                {currentRole === 'REVIEWER' && 'Audit & Verification Workspace'}
                {currentRole === 'CONSUMER' && 'Traceability & Export Portal'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 animate-in fade-in duration-100">
                {currentRole === 'OPERATOR' && 'Upload raw tapes, process files, and track ingestion lineages.'}
                {currentRole === 'REVIEWER' && 'Resolve tape conflicts, check documentation, and apply AI recommendation overrides.'}
                {currentRole === 'CONSUMER' && 'Analyze clean records, verify cryptographic hashes, and audit transaction lineages.'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {currentRole === 'OPERATOR' && (
                <button 
                  onClick={resetDatabase}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 duration-100 cursor-pointer shadow-xs"
                >
                  <IconBan className="h-3.5 w-3.5" />
                  Clear Database
                </button>
              )}
              <button 
                onClick={() => {
                  setRefreshTrigger(prev => prev + 1);
                  toast.info('Data refreshed.');
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted duration-100 cursor-pointer shadow-xs"
              >
                <IconRefresh className="h-3.5 w-3.5 animate-spin-hover" />
                Refresh Dashboard
              </button>
            </div>
          </div>

          {/* DASHBOARD STATS CARDS */}
          {loadingSummary ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            summaryData && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in duration-200">
                <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Data Quality Score</span>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-foreground">
                        {summaryData.totalLoans === 0 ? '0%' : `${summaryData.dataQualityScore}%`}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full duration-500 ${
                          summaryData.dataQualityScore >= 90 ? 'bg-emerald-500' :
                          summaryData.dataQualityScore >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} 
                        style={{ width: `${summaryData.totalLoans === 0 ? 0 : summaryData.dataQualityScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Total Ingested Records</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-foreground">{summaryData.totalLoans}</span>
                    <span className="text-xs text-muted-foreground">loans</span>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-xs border-l-2 border-l-amber-500/80">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Pending Review</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-amber-500">{summaryData.pendingReview}</span>
                    <span className="text-xs text-muted-foreground">needs audit</span>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-xs border-l-2 border-l-emerald-500/80">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Verified Records</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-emerald-500">{summaryData.verifiedLoans}</span>
                    <span className="text-xs text-muted-foreground">with hash</span>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-xs border-l-2 border-l-rose-500/80">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Rejected Records</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-rose-500">{summaryData.rejectedLoans}</span>
                    <span className="text-xs text-muted-foreground">invalid</span>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Render Page Contents */}
          {children}

          {/* BATCH SUMMARY MODAL */}
          {showBatchSummaryModal && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <IconSparkles className="h-5 w-5 text-primary animate-pulse" />
                    <h3 className="text-lg font-bold text-foreground">AI Batch Exception Summary</h3>
                  </div>
                  <button 
                    onClick={() => setShowBatchSummaryModal(false)}
                    className="text-xs font-bold bg-muted hover:bg-muted/80 text-muted-foreground px-2.5 py-1 rounded-md cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  {loadingBatchSummary ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <IconRefresh className="h-8 w-8 text-primary animate-spin" />
                      <span className="text-sm text-muted-foreground">AI is auditing selected batch...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-foreground leading-relaxed bg-muted/30 border border-border p-4 rounded-xl max-h-[300px] overflow-y-auto">
                        {batchSummaryText}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono flex items-center justify-between border-t border-border/40 pt-3">
                        <span>Selected records count: {selectedBatchIds.length}</span>
                        <span>Assistant: Gemini 1.5 Flash</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-muted/20 border-t border-border flex justify-end">
                  <button
                    onClick={() => setShowBatchSummaryModal(false)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DETAIL DRAWER / AUDIT INTERFACE FOR REVIEWERS */}
          {selectedLoanId && (
            <div 
              onClick={() => setSelectedLoanId(null)}
              className="fixed inset-0 bg-background/80 backdrop-blur-xs flex justify-end z-50 cursor-pointer"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 cursor-default"
              >
                
                {/* Drawer Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Audit Desk
                    </span>
                    <h3 className="text-lg font-bold text-foreground mt-1">
                      Audit Loan Tape Record: {selectedLoanDetail ? (selectedLoanDetail.loanId || 'Missing ID') : 'Loading...'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedLoanId(null)}
                    className="p-1 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg cursor-pointer"
                  >
                    <IconX className="h-5 w-5" />
                  </button>
                </div>

                {loadingDetail ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <IconRefresh className="h-8 w-8 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">Fetching complete audits...</span>
                  </div>
                ) : (
                  selectedLoanDetail && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      
                      {/* Active Anomalies List */}
                      {(selectedLoanDetail.exceptions || []).filter((e:any) => !e.resolved).length > 0 ? (
                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                            <IconAlertTriangle className="h-4.5 w-4.5" />
                            Unresolved Ingestion Anomalies ({(selectedLoanDetail.exceptions || []).filter((e:any) => !e.resolved).length})
                          </div>

                          <div className="space-y-2">
                            {(selectedLoanDetail.exceptions || []).filter((e:any) => !e.resolved).map((ex: any) => (
                              <div key={ex.id} className="text-xs flex gap-2">
                                <IconCornerDownRight className="h-4 w-4 shrink-0 text-rose-500/70" />
                                <div className="text-foreground">
                                  <span className="font-bold border border-rose-500/20 bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded-sm mr-2">{ex.field}</span>
                                  {ex.message}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-2 text-emerald-600 font-bold text-sm">
                          <IconCircleCheck className="h-4.5 w-4.5" />
                          Data verification complete: No active anomalies.
                        </div>
                      )}

                      {/* AI Copilot Verification Panel */}
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-primary font-bold text-sm">
                            <IconSparkles className="h-5 w-5 text-primary" />
                            AI Review Assistant
                          </div>
                          
                          <button
                            onClick={triggerAiCopilot}
                            disabled={generatingAI}
                            className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 disabled:bg-primary/50 py-1.5 px-3.5 rounded-lg shadow-sm duration-100 cursor-pointer flex items-center gap-1"
                          >
                            {generatingAI && <IconRefresh className="h-3 w-3 animate-spin" />}
                            {aiRecommendation ? 'Rerun Analysis' : 'Analyze with AI Copilot'}
                          </button>
                        </div>

                        {aiRecommendation && (
                          <div className="text-xs space-y-3 pt-2 border-t border-primary/10">
                            <div>
                              <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[9px] mb-1">
                                AI Explanation:
                              </p>
                              <p className="text-foreground leading-relaxed">
                                {aiRecommendation.explanation}
                              </p>
                            </div>

                            {aiRecommendation.suggestion && Object.keys(aiRecommendation.suggestion).length > 0 && (
                              <div>
                                <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[9px] mb-1">
                                  Suggested Corrections:
                                </p>
                                <div className="bg-card border border-border p-2 rounded-lg space-y-1.5">
                                  {Object.entries(aiRecommendation.suggestion).map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between font-mono text-[10px]">
                                      <span className="text-muted-foreground">{key}:</span>
                                      <span className="text-emerald-500 font-bold">{String(val)}</span>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={applyAiSuggestions}
                                  className="mt-2.5 text-[10px] font-bold text-primary border border-primary/20 hover:bg-primary/10 hover:border-primary px-3 py-1 rounded-md duration-700 cursor-pointer"
                                >
                                  Apply AI Suggestions
                                </button>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[9px] text-muted-foreground border-t border-border/40 pt-2 font-mono">
                              <span>Model: {aiRecommendation.model}</span>
                              <span>Analyzed: {new Date(aiRecommendation.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {currentRole === 'CONSUMER' ? (
                        <div className="space-y-6 pt-4 border-t border-border">
                          {/* Canonical Properties Grid */}
                          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                              <IconDatabase className="h-4 w-4 text-emerald-500" />
                              Canonical Loan Properties
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase">Loan ID</span>
                                <strong className="text-foreground">{selectedLoanDetail.loanId}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase">Borrower ID</span>
                                <strong className="text-foreground">{selectedLoanDetail.borrowerId}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase">Loan Type</span>
                                <strong className="text-foreground">{selectedLoanDetail.loanType}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase">Origination Date</span>
                                <strong className="text-foreground">{selectedLoanDetail.originationDate}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase">Maturity Date</span>
                                <strong className="text-foreground">{selectedLoanDetail.maturityDate}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase">Original Principal</span>
                                <strong className="text-foreground">${selectedLoanDetail.originalPrincipal.toLocaleString()}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase">Current Balance</span>
                                <strong className="text-foreground">${selectedLoanDetail.currentBalance.toLocaleString()}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase">Interest Rate</span>
                                <strong className="text-foreground">{selectedLoanDetail.interestRate}%</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase">Term Months</span>
                                <strong className="text-foreground">{selectedLoanDetail.termMonths} months</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase">State Code</span>
                                <strong className="text-foreground font-mono">{selectedLoanDetail.borrowerState}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase">Payment Status</span>
                                <strong className="text-foreground">{selectedLoanDetail.paymentStatus}</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase">Days Past Due</span>
                                <strong className="text-foreground">{selectedLoanDetail.daysPastDue} DPD</strong>
                              </div>
                            </div>
                          </div>

                          {/* Cryptographic Hash Banner */}
                          <div className="bg-muted/40 border border-border rounded-xl p-4 text-xs flex items-center justify-between">
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase">Verification Hash (SHA-256)</span>
                              <code className="text-foreground font-mono font-bold text-[10px] break-all">{selectedLoanDetail.hash}</code>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-muted-foreground block text-[10px] uppercase">Verified By</span>
                              <strong className="text-foreground font-mono text-[10px]">@{selectedLoanDetail.verifiedBy === 'usr-2' ? 'bob_reviewer' : 'System'}</strong>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Audit Review Editor Form */
                        <div className="space-y-4 border-t border-border pt-4">
                          <h4 className="text-sm font-bold text-foreground">Resolve Anomalies Editor</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase">
                                Current Balance
                              </label>
                              <input
                                type="number"
                                value={editedFields.currentBalance !== undefined ? editedFields.currentBalance : selectedLoanDetail.currentBalance}
                                onChange={(e) => setEditedFields({ ...editedFields, currentBalance: e.target.value })}
                                className="w-full bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-foreground"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase">
                                Payment Status
                              </label>
                              <input
                                type="text"
                                value={editedFields.paymentStatus !== undefined ? editedFields.paymentStatus : selectedLoanDetail.paymentStatus}
                                onChange={(e) => setEditedFields({ ...editedFields, paymentStatus: e.target.value })}
                                className="w-full bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-foreground"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase">
                                Interest Rate (%)
                              </label>
                              <input
                                type="number"
                                step="0.001"
                                value={editedFields.interestRate !== undefined ? editedFields.interestRate : selectedLoanDetail.interestRate}
                                onChange={(e) => setEditedFields({ ...editedFields, interestRate: e.target.value })}
                                className="w-full bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-foreground"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase">
                                Maturity Date (YYYY-MM-DD)
                              </label>
                              <input
                                type="text"
                                value={editedFields.maturityDate !== undefined ? editedFields.maturityDate : selectedLoanDetail.maturityDate}
                                onChange={(e) => setEditedFields({ ...editedFields, maturityDate: e.target.value })}
                                className="w-full bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-foreground"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase">
                              Reviewer Action Log Notes
                            </label>
                            <textarea
                              value={reviewerNotes}
                              onChange={(e) => setReviewerNotes(e.target.value)}
                              placeholder="State justification details for audits/overrides..."
                              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-foreground min-h-[60px]"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={saveFieldChanges}
                              disabled={savingReview || Object.keys(editedFields).length === 0}
                              className="text-xs font-semibold px-4 py-2 rounded-lg border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground duration-100 disabled:opacity-50 cursor-pointer"
                            >
                              Save Corrections
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Chronicled Audit Logs */}
                      <div className="border-t border-border pt-4">
                        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                          <IconClock className="h-4.5 w-4.5 text-primary" />
                          Chronological Audit Trail (Verification Lineage)
                        </h4>
                        
                        {loadingAuditTrail ? (
                          <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                            <IconRefresh className="h-4.5 w-4.5 animate-spin" />
                            Retrieving chronological logs...
                          </div>
                        ) : loanAuditTrail && loanAuditTrail.length > 0 ? (
                          <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                            {loanAuditTrail.map((log: any) => {
                              const details = JSON.parse(log.details);
                              return (
                                <div key={log.id} className="text-[11px] p-3 bg-muted/40 border border-border rounded-lg flex items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                                        log.action === 'APPROVE' ? 'bg-emerald-500/10 text-emerald-600' :
                                        log.action === 'REJECT' ? 'bg-rose-500/10 text-rose-600' :
                                        log.action === 'FIELD_EDIT' ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'
                                      }`}>
                                        {log.action}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">by {log.user?.username || 'System'}</span>
                                    </div>
                                    <p className="text-foreground text-left">
                                      {log.action === 'FIELD_EDIT' && <>Changed field <strong>{details.field}</strong> from <span className="line-through text-rose-500">{details.oldValue}</span> to <span className="text-emerald-500 font-bold">{details.newValue}</span></>}
                                      {log.action === 'UPLOAD' && <>Ingested raw document tape <strong>{details.sourceFile}</strong></>}
                                      {log.action === 'COMMENT' && <>Added verification comment: <em>"{details.comment}"</em></>}
                                      {log.action === 'AI_SUGGESTION' && <>AI generated suggestion under model <strong>{details.model}</strong></>}
                                      {log.action === 'APPROVE' && <>Verified record and generated integrity hash: <code className="text-[9px] font-mono">{details.hash?.substring(0, 16)}...</code></>}
                                      {log.action === 'REJECT' && <>Rejected record due to: <em>"{details.reason}"</em></>}
                                    </p>
                                  </div>
                                  <span className="text-[9px] text-muted-foreground font-mono shrink-0 pt-0.5">
                                    {new Date(log.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-xs text-muted-foreground">No audit logs found for this record.</div>
                        )}
                      </div>

                      {/* Drawer Actions for Reviewers */}
                      {currentRole !== 'CONSUMER' && (
                        <div className="border-t border-border pt-5 flex items-center justify-end gap-2 bg-muted/20 -mx-6 -mb-6 p-6">
                          <button
                            onClick={() => finalizeReview('REJECT')}
                            disabled={savingReview}
                            className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-500/50 text-white text-xs font-semibold px-4.5 py-2 rounded-lg shadow-sm duration-100 cursor-pointer"
                          >
                            Reject Record
                          </button>
                          <button
                            onClick={() => finalizeReview('APPROVE')}
                            disabled={savingReview}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500/50 text-white text-xs font-semibold px-4.5 py-2 rounded-lg shadow-sm duration-100 cursor-pointer flex items-center gap-1"
                          >
                            <IconCircleCheck className="h-4.5 w-4.5" />
                            Approve & Verify
                          </button>
                        </div>
                      )}

                    </div>
                  )
                )}

              </div>
            </div>
          )}

          {/* CONFIRMATION MODAL CARD */}
          {showConfirmModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <IconAlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">{confirmTitle}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{confirmMessage}</p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground py-2 px-4 rounded-lg border border-border duration-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (confirmAction) {
                        confirmAction();
                      }
                      setShowConfirmModal(false);
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold py-2 px-4 rounded-lg shadow-sm cursor-pointer duration-100"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <WorkspaceLayoutInner>{children}</WorkspaceLayoutInner>
    </WorkspaceProvider>
  );
}
