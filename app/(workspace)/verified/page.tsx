"use client"

import React from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { IconDownload, IconLock } from '@tabler/icons-react';

export default function VerifiedPage() {
  const { verifiedLoans, setSelectedLoanId, exportVerifiedCSV } = useWorkspace();

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-xs animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
        <h3 className="text-lg font-bold text-foreground">Verified Canonical Loan Database</h3>
        <button
          onClick={exportVerifiedCSV}
          className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3.5 rounded-lg shadow-sm duration-100 cursor-pointer"
        >
          <IconDownload className="h-4 w-4" />
          Export clean CSV Tape
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border text-muted-foreground font-semibold">
              <th className="py-2.5">Loan ID</th>
              <th className="py-2.5">Borrower ID</th>
              <th className="py-2.5">Outstanding Balance</th>
              <th className="py-2.5">Interest Rate</th>
              <th className="py-2.5">Record Hash</th>
              <th className="py-2.5">Verified By</th>
            </tr>
          </thead>
          <tbody>
            {verifiedLoans.length > 0 ? (
              verifiedLoans.map((loan) => (
                <tr 
                  key={loan.id} 
                  onClick={() => setSelectedLoanId(loan.id)}
                  className="border-b border-border/50 hover:bg-muted/10 cursor-pointer"
                >
                  <td className="py-3.5 font-bold text-foreground">{loan.loanId}</td>
                  <td className="py-3.5 text-foreground">{loan.borrowerId}</td>
                  <td className="py-3.5 text-foreground font-semibold">${loan.currentBalance.toLocaleString()}</td>
                  <td className="py-3.5 text-foreground">{loan.interestRate}%</td>
                  <td className="py-3.5" title={loan.hash}>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border w-28 overflow-hidden text-ellipsis whitespace-nowrap">
                      <IconLock className="h-2.5 w-2.5 text-emerald-500" />
                      {loan.hash}
                    </div>
                  </td>
                  <td className="py-3.5 text-xs text-muted-foreground">
                    {loan.verifiedBy === 'usr-2' ? 'bob_reviewer' : 'System'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  No loan records verified yet. Go to Reviewer role to audit and approve records!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
