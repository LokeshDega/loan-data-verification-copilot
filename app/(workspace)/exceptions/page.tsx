"use client"

import React from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { 
  IconSparkles, 
  IconCircleCheck, 
  IconBan, 
  IconChevronDown, 
  IconArrowRight 
} from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu';

export default function ExceptionsPage() {
  const {
    searchQuery,
    setSearchQuery,
    severityFilter,
    setSeverityFilter,
    typeFilter,
    setTypeFilter,
    selectedBatchIds,
    setSelectedBatchIds,
    generateBatchExceptionSummary,
    finalizeBulkReview,
    loans,
    loadingLoans,
    setSelectedLoanId
  } = useWorkspace();

  // Filter logic
  const filteredLoans = loans.filter((loan) => {
    const matchesSearch = searchQuery === '' || 
      loan.loanId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.borrowerId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === '' || 
      loan.exceptions.some((ex: any) => ex.severity === severityFilter && !ex.resolved);

    const matchesType = typeFilter === '' || 
      loan.exceptions.some((ex: any) => ex.type === typeFilter && !ex.resolved);

    return matchesSearch && matchesSeverity && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Filtering Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by Loan ID or Borrower ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/40 border border-border rounded-lg pl-3.5 pr-3.5 py-1.5 text-sm font-medium text-foreground focus:outline-hidden focus:border-primary/60"
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full sm:w-40 bg-black text-white border border-neutral-800 rounded-lg px-2.5 py-1.5 text-sm font-medium cursor-pointer flex items-center justify-between focus:outline-hidden focus:border-neutral-700 select-none">
                <span>
                  {severityFilter === 'HIGH' && 'High Severity'}
                  {severityFilter === 'MEDIUM' && 'Medium Severity'}
                  {severityFilter === 'LOW' && 'Low Severity'}
                  {!severityFilter && 'All Severities'}
                </span>
                <IconChevronDown className="h-3 w-3 text-neutral-400 font-bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black border border-neutral-800 text-white rounded-lg p-1 shadow-xl w-40">
              <DropdownMenuItem
                onClick={() => setSeverityFilter('')}
                className={`text-xs px-2.5 py-1.5 my-[3px] rounded-md cursor-pointer hover:bg-neutral-800 text-white outline-hidden focus:bg-neutral-800 ${!severityFilter ? 'bg-neutral-800/80 font-bold' : ''}`}
              >
                All Severities
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSeverityFilter('HIGH')}
                className={`text-xs px-2.5 py-1.5 my-[3px] rounded-md cursor-pointer hover:bg-neutral-800 text-white outline-hidden focus:bg-neutral-800 ${severityFilter === 'HIGH' ? 'bg-neutral-800/80 font-bold' : ''}`}
              >
                High Severity
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSeverityFilter('MEDIUM')}
                className={`text-xs px-2.5 py-1.5 my-[3px] rounded-md cursor-pointer hover:bg-neutral-800 text-white outline-hidden focus:bg-neutral-800 ${severityFilter === 'MEDIUM' ? 'bg-neutral-800/80 font-bold' : ''}`}
              >
                Medium Severity
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSeverityFilter('LOW')}
                className={`text-xs px-2.5 py-1.5 my-[3px] rounded-md cursor-pointer hover:bg-neutral-800 text-white outline-hidden focus:bg-neutral-800 ${severityFilter === 'LOW' ? 'bg-neutral-800/80 font-bold' : ''}`}
              >
                Low Severity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full sm:w-48 bg-black text-white border border-neutral-800 rounded-lg px-2.5 py-1.5 text-sm font-medium cursor-pointer flex items-center justify-between focus:outline-hidden focus:border-neutral-700 select-none">
                <span>
                  {typeFilter === 'MISSING_FIELD' && 'Missing Fields'}
                  {typeFilter === 'DUPLICATE_RECORD' && 'Duplicate Loan IDs'}
                  {typeFilter === 'INVALID_DATE_ORDER' && 'Date Order Errors'}
                  {typeFilter === 'INVALID_BALANCE' && 'Balance Errors'}
                  {typeFilter === 'OUT_OF_RANGE' && 'Out Of Range Rates'}
                  {typeFilter === 'SOURCE_CONFLICT' && 'Cross-Source Conflicts'}
                  {typeFilter === 'STATUS_DPD_INCONSISTENCY' && 'Status/DPD Mismatch'}
                  {!typeFilter && 'All Exception Types'}
                </span>
                <IconChevronDown className="h-3 w-3 text-neutral-400 font-bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black border border-neutral-800 text-white rounded-lg p-1 shadow-xl w-48">
              {[
                { val: '', label: 'All Exception Types' },
                { val: 'MISSING_FIELD', label: 'Missing Fields' },
                { val: 'DUPLICATE_RECORD', label: 'Duplicate Loan IDs' },
                { val: 'INVALID_DATE_ORDER', label: 'Date Order Errors' },
                { val: 'INVALID_BALANCE', label: 'Balance Errors' },
                { val: 'OUT_OF_RANGE', label: 'Out Of Range Rates' },
                { val: 'SOURCE_CONFLICT', label: 'Cross-Source Conflicts' },
                { val: 'STATUS_DPD_INCONSISTENCY', label: 'Status/DPD Mismatch' }
              ].map((item) => (
                <DropdownMenuItem
                  key={item.val}
                  onClick={() => setTypeFilter(item.val)}
                  className={`text-xs px-2.5 py-1.5 my-[3px] rounded-md cursor-pointer hover:bg-neutral-800 text-white outline-hidden focus:bg-neutral-800 ${typeFilter === item.val ? 'bg-neutral-800/80 font-bold' : ''}`}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedBatchIds.length > 0 && (
        <div className="flex items-center justify-between gap-4 bg-primary/10 border border-primary/20 p-4 rounded-xl shadow-xs animate-in slide-in-from-top-4 duration-150">
          <div className="text-sm font-semibold text-foreground">
            Selected <span className="text-primary font-bold">{selectedBatchIds.length}</span> loan records for bulk analysis.
          </div>
          <div className="flex gap-2">
            <button
              onClick={generateBatchExceptionSummary}
              className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 py-2 px-4 rounded-lg shadow-sm cursor-pointer duration-100"
            >
              <IconSparkles className="h-4 w-4" />
              AI Batch Summary
            </button>
            <button
              onClick={() => finalizeBulkReview('APPROVE')}
              className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg shadow-sm cursor-pointer duration-100"
            >
              <IconCircleCheck className="h-4 w-4" />
              Bulk Approve
            </button>
            <button
              onClick={() => finalizeBulkReview('REJECT')}
              className="flex items-center gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-lg shadow-sm cursor-pointer duration-100"
            >
              <IconBan className="h-4 w-4" />
              Bulk Reject
            </button>
            <button
              onClick={() => setSelectedBatchIds([])}
              className="text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground py-2 px-3 rounded-lg border border-border duration-100 cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Exception Queue Grid */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Exception Queue ({filteredLoans.length} Loans)</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-semibold bg-muted/10">
                <th className="py-3 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedBatchIds.length === filteredLoans.length && filteredLoans.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBatchIds(filteredLoans.map(l => l.id));
                      } else {
                        setSelectedBatchIds([]);
                      }
                    }}
                    className="rounded-sm border-border cursor-pointer bg-muted/40"
                  />
                </th>
                <th className="py-3 px-6 whitespace-nowrap">Loan ID</th>
                <th className="py-3 px-6 whitespace-nowrap">Borrower ID</th>
                <th className="py-3 px-6 whitespace-nowrap">Principal</th>
                <th className="py-3 px-6 whitespace-nowrap">Interest Rate</th>
                <th className="py-3 px-6 whitespace-nowrap">State</th>
                <th className="py-3 px-6 whitespace-nowrap">Payment Status</th>
                <th className="py-3 px-6 whitespace-nowrap">Active Exceptions</th>
                <th className="py-3 px-6 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingLoans ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-border h-12" />
                ))
              ) : filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <tr 
                    key={loan.id} 
                    onClick={() => setSelectedLoanId(loan.id)}
                    className="border-b border-border/60 hover:bg-muted/10 transition duration-75 cursor-pointer"
                  >
                    <td onClick={(e) => e.stopPropagation()} className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedBatchIds.includes(loan.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBatchIds(prev => [...prev, loan.id]);
                          } else {
                            setSelectedBatchIds(prev => prev.filter(id => id !== loan.id));
                          }
                        }}
                        className="rounded-sm border-border cursor-pointer bg-muted/40"
                      />
                    </td>
                    <td className="py-3.5 px-6 font-bold text-foreground whitespace-nowrap">{loan.loanId || 'Missing'}</td>
                    <td className="py-3.5 px-6 text-foreground whitespace-nowrap">{loan.borrowerId || 'Missing'}</td>
                    <td className="py-3.5 px-6 text-foreground font-semibold whitespace-nowrap">${loan.originalPrincipal.toLocaleString()}</td>
                    <td className="py-3.5 px-6 text-foreground whitespace-nowrap">{loan.interestRate}%</td>
                    <td className="py-3.5 px-6 text-foreground font-mono whitespace-nowrap">{loan.borrowerState}</td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-muted text-foreground">
                        {loan.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="flex gap-1">
                        {loan.exceptions.map((ex: any) => (
                          <span key={ex.id} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ex.severity === 'HIGH' 
                              ? 'bg-rose-500/10 text-rose-600 border border-rose-500/10' 
                              : ex.severity === 'MEDIUM' 
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/10'
                              : 'bg-blue-500/10 text-blue-600 border border-blue-500/10'
                          }`} title={ex.message}>
                            {ex.type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLoanId(loan.id)}
                        className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-foreground hover:bg-primary py-1 px-3.5 rounded-lg border border-primary/20 hover:border-primary duration-100 cursor-pointer"
                      >
                        Review
                        <IconArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    No active exception records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
