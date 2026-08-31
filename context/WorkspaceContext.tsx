"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRole } from '@/context/RoleContext';
import { toast } from 'sonner';

type WorkspaceContextType = {
  // Filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  severityFilter: string;
  setSeverityFilter: (s: string) => void;
  typeFilter: string;
  setTypeFilter: (t: string) => void;

  // Ingestion State
  uploading: string | null;
  setUploading: (u: string | null) => void;
  selectedUploadType: 'LOAN_TAPE' | 'SERVICER_UPDATE' | 'DOCUMENT_MANIFEST';
  setSelectedUploadType: (t: 'LOAN_TAPE' | 'SERVICER_UPDATE' | 'DOCUMENT_MANIFEST') => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;

  // Selection Detail States
  selectedLoanId: string | null;
  setSelectedLoanId: (id: string | null) => void;
  selectedLoanDetail: any;
  setSelectedLoanDetail: (detail: any) => void;
  loadingDetail: boolean;

  // AI Assistant States
  generatingAI: boolean;
  aiRecommendation: any;
  setAiRecommendation: (rec: any) => void;

  // Batch Summary overlay states
  selectedBatchIds: string[];
  setSelectedBatchIds: React.Dispatch<React.SetStateAction<string[]>>;
  batchSummaryText: string;
  loadingBatchSummary: boolean;
  showBatchSummaryModal: boolean;
  setShowBatchSummaryModal: (show: boolean) => void;

  // Rules Playground States
  naturalRuleInput: string;
  setNaturalRuleInput: (i: string) => void;
  generatingRule: boolean;
  generatedRuleResult: any;

  // Audit trail state
  loanAuditTrail: any[] | null;
  loadingAuditTrail: boolean;

  // Editor states
  editedFields: Record<string, any>;
  setEditedFields: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  reviewerNotes: string;
  setReviewerNotes: (n: string) => void;
  savingReview: boolean;

  // Data state queries
  refreshTrigger: number;
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
  summaryData: any;
  loadingSummary: boolean;
  loans: any[];
  loadingLoans: boolean;
  verifiedLoans: any[];

  // Operational Operations Handlers
  fetchSummary: () => Promise<void>;
  fetchLoans: () => Promise<void>;
  fetchVerifiedLoans: () => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  triggerAiCopilot: () => Promise<void>;
  applyAiSuggestions: () => void;
  generateBatchExceptionSummary: () => Promise<void>;
  generateValidationRuleFromText: () => Promise<void>;
  finalizeBulkReview: (action: 'APPROVE' | 'REJECT') => Promise<void>;
  saveFieldChanges: () => Promise<void>;
  finalizeReview: (action: 'APPROVE' | 'REJECT') => Promise<void>;
  resetDatabase: () => Promise<void>;
  exportVerifiedCSV: () => void;

  // Confirmation Modal States
  showConfirmModal: boolean;
  setShowConfirmModal: (show: boolean) => void;
  confirmTitle: string;
  confirmMessage: string;
  confirmAction: (() => void) | null;
  triggerConfirm: (title: string, message: string, onConfirm: () => void) => void;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { currentRole, currentUser } = useRole();

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedUploadType, setSelectedUploadType] = useState<'LOAN_TAPE' | 'SERVICER_UPDATE' | 'DOCUMENT_MANIFEST'>('LOAN_TAPE');

  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [selectedLoanDetail, setSelectedLoanDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);

  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [batchSummaryText, setBatchSummaryText] = useState<string>('');
  const [loadingBatchSummary, setLoadingBatchSummary] = useState(false);
  const [showBatchSummaryModal, setShowBatchSummaryModal] = useState(false);

  const [naturalRuleInput, setNaturalRuleInput] = useState('');
  const [generatingRule, setGeneratingRule] = useState(false);
  const [generatedRuleResult, setGeneratedRuleResult] = useState<any>(null);

  // Confirmation Dialog States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => onConfirm);
    setShowConfirmModal(true);
  };

  const [loanAuditTrail, setLoanAuditTrail] = useState<any[] | null>(null);
  const [loadingAuditTrail, setLoadingAuditTrail] = useState(false);

  const [editedFields, setEditedFields] = useState<Record<string, any>>({});
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [summaryData, setSummaryData] = useState<any>({
    totalLoans: 0,
    pendingReview: 0,
    verifiedLoans: 0,
    rejectedLoans: 0,
    dataQualityScore: 0,
    recentDecisions: []
  });
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loans, setLoans] = useState<any[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [verifiedLoans, setVerifiedLoans] = useState<any[]>([]);

  // Fetch Dashboard Summary Analytics
  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await fetch('/api/summary');
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch Loan Records
  const fetchLoans = async () => {
    try {
      setLoadingLoans(true);
      const res = await fetch('/api/loans');
      if (res.ok) {
        const data = await res.json();
        setLoans(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLoans(false);
    }
  };

  // Fetch Verified Loan Records
  const fetchVerifiedLoans = async () => {
    try {
      const res = await fetch('/api/verified-loans');
      if (res.ok) {
        const data = await res.json();
        setVerifiedLoans(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger loading on mount & role change & refreshTrigger
  useEffect(() => {
    fetchSummary();
    fetchLoans();
    fetchVerifiedLoans();
  }, [refreshTrigger, currentRole]);

  // Handle CSV upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(selectedUploadType);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceType', selectedUploadType);
      formData.append('userId', currentUser.id);

      const res = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully uploaded ${file.name}`, {
          description: `${data.message}`,
        });
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast.error('Ingestion failed', {
          description: data.error || 'Check file format.',
        });
      }
    } catch (err: any) {
      toast.error('Error uploading file', {
        description: err.message,
      });
    } finally {
      setUploading(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Load specific loan detail for drawer
  useEffect(() => {
    if (!selectedLoanId) {
      setSelectedLoanDetail(null);
      setAiRecommendation(null);
      setEditedFields({});
      setReviewerNotes('');
      return;
    }

    const loadDetail = async () => {
      try {
        setLoadingDetail(true);
        setAiRecommendation(null);
        setEditedFields({});
        setReviewerNotes('');
        
        const url = currentRole === 'CONSUMER' 
          ? `/api/verified-loans/${selectedLoanId}`
          : `/api/loans/${selectedLoanId}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSelectedLoanDetail(data);
          if (data.aiRecommendations && data.aiRecommendations.length > 0) {
            const latestRec = data.aiRecommendations[0];
            setAiRecommendation({
              explanation: latestRec.explanation,
              suggestion: JSON.parse(latestRec.suggestion),
              model: latestRec.model,
              timestamp: latestRec.timestamp
            });
          }
        } else {
          toast.error('Failed to load loan details');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDetail(false);
      }
    };

    loadDetail();
  }, [selectedLoanId, currentRole]);

  // Request AI recommendation
  const triggerAiCopilot = async () => {
    if (!selectedLoanId) return;

    try {
      setGeneratingAI(true);
      const res = await fetch(`/api/loans/${selectedLoanId}/ai-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });

      const data = await res.json();
      if (res.ok) {
        setAiRecommendation(data);
        toast.success('AI recommendation loaded!');
      } else {
        toast.error('AI Recommendation failed', { description: data.error });
      }
    } catch (e: any) {
      toast.error('AI error', { description: e.message });
    } finally {
      setGeneratingAI(false);
    }
  };

  // Apply AI suggestions to local state form fields
  const applyAiSuggestions = () => {
    if (!aiRecommendation || !aiRecommendation.suggestion) return;
    
    const suggestion = aiRecommendation.suggestion;
    const newFields = { ...editedFields };
    
    Object.entries(suggestion).forEach(([key, val]) => {
      newFields[key] = val;
    });

    setEditedFields(newFields);
    toast.info('Applied AI recommended corrections to editor fields.');
  };

  const generateBatchExceptionSummary = async () => {
    if (selectedBatchIds.length === 0) return;
    try {
      setLoadingBatchSummary(true);
      setBatchSummaryText('');
      setShowBatchSummaryModal(true);
      
      const res = await fetch('/api/exceptions/batch-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanIds: selectedBatchIds })
      });
      const data = await res.json();
      if (res.ok) {
        setBatchSummaryText(data.summary);
      } else {
        toast.error('Failed to generate batch summary', { description: data.error });
        setShowBatchSummaryModal(false);
      }
    } catch (e: any) {
      toast.error('Error generating batch summary', { description: e.message });
      setShowBatchSummaryModal(false);
    } finally {
      setLoadingBatchSummary(false);
    }
  };

  const generateValidationRuleFromText = async () => {
    if (!naturalRuleInput.trim()) {
      toast.warning('Please input a rule description.');
      return;
    }
    try {
      setGeneratingRule(true);
      setGeneratedRuleResult(null);
      const res = await fetch('/api/rules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleDescription: naturalRuleInput })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedRuleResult(data);
        toast.success('Validation rule and tests generated successfully!');
      } else {
        toast.error('Rule generation failed', { description: data.error });
      }
    } catch (e: any) {
      toast.error('Error generating rule', { description: e.message });
    } finally {
      setGeneratingRule(false);
    }
  };

  const finalizeBulkReview = async (action: 'APPROVE' | 'REJECT') => {
    if (selectedBatchIds.length === 0) return;
    
    triggerConfirm(
      `Bulk ${action === 'APPROVE' ? 'Approval' : 'Rejection'}`,
      `Are you sure you want to bulk ${action.toLowerCase()} the ${selectedBatchIds.length} selected loan records?`,
      async () => {
        try {
          setLoadingLoans(true);
          const promises = selectedBatchIds.map(id => 
            fetch(`/api/loans/${id}/review`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action,
                reviewerNotes: `Bulk ${action.toLowerCase()}d by reviewer`,
                userId: currentUser.id
              })
            })
          );
          
          const results = await Promise.all(promises);
          const allSuccess = results.every(res => res.ok);
          
          if (allSuccess) {
            toast.success(`Successfully bulk ${action.toLowerCase()}d ${selectedBatchIds.length} records!`);
          } else {
            toast.warning(`Bulk action complete, but some records failed to process.`);
          }
          
          setSelectedBatchIds([]);
          setRefreshTrigger(prev => prev + 1);
        } catch (e: any) {
          toast.error('Error during bulk action', { description: e.message });
        } finally {
          setLoadingLoans(false);
        }
      }
    );
  };

  // Load audit logs trail
  useEffect(() => {
    if (!selectedLoanDetail) {
      setLoanAuditTrail(null);
      return;
    }
    const fetchAuditTrail = async () => {
      try {
        setLoadingAuditTrail(true);
        const res = await fetch(`/api/audit/${selectedLoanDetail.loanId}`);
        if (res.ok) {
          const data = await res.json();
          setLoanAuditTrail(data.auditLogs);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAuditTrail(false);
      }
    };
    fetchAuditTrail();
  }, [selectedLoanDetail]);

  // Submit manual field changes
  const saveFieldChanges = async () => {
    if (!selectedLoanId) return;

    try {
      setSavingReview(true);
      const res = await fetch(`/api/loans/${selectedLoanId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_FIELDS',
          fields: editedFields,
          reviewerNotes,
          userId: currentUser.id
        })
      });

      if (res.ok) {
        toast.success('Fields corrected successfully!');
        const detailsRes = await fetch(`/api/loans/${selectedLoanId}`);
        if (detailsRes.ok) {
          const detailData = await detailsRes.json();
          setSelectedLoanDetail(detailData);
          setEditedFields({});
        }
        setRefreshTrigger(prev => prev + 1);
      } else {
        const error = await res.json();
        toast.error('Correction failed', { description: error.error });
      }
    } catch (e: any) {
      toast.error('Server error', { description: e.message });
    } finally {
      setSavingReview(false);
    }
  };

  // Approve or Reject loan record
  const finalizeReview = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedLoanId) return;

    try {
      setSavingReview(true);
      const res = await fetch(`/api/loans/${selectedLoanId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewerNotes,
          userId: currentUser.id
        })
      });

      if (res.ok) {
        toast.success(`Record marked as ${action === 'APPROVE' ? 'VERIFIED' : 'REJECTED'}`);
        setSelectedLoanId(null);
        setRefreshTrigger(prev => prev + 1);
      } else {
        const error = await res.json();
        toast.error('Action failed', { description: error.error });
      }
    } catch (e: any) {
      toast.error('Error finalizing review', { description: e.message });
    } finally {
      setSavingReview(false);
    }
  };

  const resetDatabase = async () => {
    triggerConfirm(
      'Reset Database',
      'Are you sure you want to clear all uploaded data, exceptions, and logs? This action cannot be undone.',
      async () => {
        try {
          const res = await fetch('/api/ingest', { method: 'DELETE' });
          if (res.ok) {
            toast.success('Database cleared successfully!');
            setRefreshTrigger(prev => prev + 1);
          } else {
            const data = await res.json();
            toast.error('Failed to clear database', { description: data.error });
          }
        } catch (e: any) {
          toast.error('Reset error', { description: e.message });
        }
      }
    );
  };

  const exportVerifiedCSV = () => {
    if (verifiedLoans.length === 0) {
      toast.error('No verified records to export.');
      return;
    }
    const headers = [
      'Loan ID', 'Borrower ID', 'Origination Date', 'Maturity Date', 
      'Original Principal', 'Current Balance', 'Interest Rate', 'Term Months', 
      'Borrower State', 'Payment Status', 'Days Past Due', 'Servicer Name',
      'Document Status', 'Verified At', 'Verified By', 'Rec Hash'
    ];
    const csvRows = [headers.join(',')];

    verifiedLoans.forEach(record => {
      const row = [
        record.loanId,
        record.borrowerId,
        record.originationDate,
        record.maturityDate,
        record.originalPrincipal,
        record.currentBalance,
        record.interestRate,
        record.termMonths,
        record.borrowerState,
        record.paymentStatus,
        record.daysPastDue,
        record.servicerName,
        record.documentStatus,
        record.verifiedAt ? new Date(record.verifiedAt).toISOString() : '',
        record.verifiedBy || '',
        record.hash || ''
      ];
      csvRows.push(row.map(val => {
        const valStr = String(val);
        if (valStr.includes(',') || valStr.includes('"') || valStr.includes('\n')) {
          return `"${valStr.replace(/"/g, '""')}"`;
        }
        return valStr;
      }).join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `verified_loans_tape_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Successfully exported verified loans tape CSV!');
  };

  return (
    <WorkspaceContext.Provider
      value={{
        searchQuery, setSearchQuery,
        severityFilter, setSeverityFilter,
        typeFilter, setTypeFilter,
        uploading, setUploading,
        selectedUploadType, setSelectedUploadType,
        fileInputRef,
        selectedLoanId, setSelectedLoanId,
        selectedLoanDetail, setSelectedLoanDetail,
        loadingDetail,
        generatingAI,
        aiRecommendation, setAiRecommendation,
        selectedBatchIds, setSelectedBatchIds,
        batchSummaryText,
        loadingBatchSummary,
        showBatchSummaryModal, setShowBatchSummaryModal,
        naturalRuleInput, setNaturalRuleInput,
        generatingRule,
        generatedRuleResult,
        loanAuditTrail,
        loadingAuditTrail,
        editedFields, setEditedFields,
        reviewerNotes, setReviewerNotes,
        savingReview,
        refreshTrigger, setRefreshTrigger,
        summaryData,
        loadingSummary,
        loans,
        loadingLoans,
        verifiedLoans,
        fetchSummary,
        fetchLoans,
        fetchVerifiedLoans,
        handleFileUpload,
        triggerAiCopilot,
        applyAiSuggestions,
        generateBatchExceptionSummary,
        generateValidationRuleFromText,
        finalizeBulkReview,
        saveFieldChanges,
        finalizeReview,
        resetDatabase,
        exportVerifiedCSV,
        showConfirmModal, setShowConfirmModal,
        confirmTitle, confirmMessage,
        confirmAction, triggerConfirm
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
