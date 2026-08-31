"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'OPERATOR' | 'REVIEWER' | 'CONSUMER';

interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  avatar: string;
}

interface RoleContextType {
  currentRole: UserRole;
  currentUser: User;
  setRole: (role: UserRole) => void;
  usersList: User[];
}

const usersList: User[] = [
  { id: 'usr-1', name: 'Alice Smith', username: 'alice_operator', role: 'OPERATOR', avatar: 'https://avatar.iran.liara.run/public/32' },
  { id: 'usr-2', name: 'Bob Jones', username: 'bob_reviewer', role: 'REVIEWER', avatar: 'https://avatar.iran.liara.run/public/56' },
  { id: 'usr-3', name: 'Charlie Brown', username: 'charlie_consumer', role: 'CONSUMER', avatar: 'https://avatar.iran.liara.run/public/64' }
];

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('OPERATOR');
  const [currentUser, setCurrentUser] = useState<User>(usersList[0]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('simulated_role');
      if (saved && ['OPERATOR', 'REVIEWER', 'CONSUMER'].includes(saved)) {
        setCurrentRole(saved as UserRole);
        const user = usersList.find(u => u.role === saved);
        if (user) {
          setCurrentUser(user);
        }
      }
    }
  }, []);

  const setRole = (role: UserRole) => {
    setCurrentRole(role);
    const user = usersList.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('simulated_role', role);
    }
  };

  return (
    <RoleContext.Provider value={{ currentRole, currentUser, setRole, usersList }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
