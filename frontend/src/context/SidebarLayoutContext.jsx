import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const SidebarLayoutContext = createContext(null);

export const SidebarLayoutProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({ isOpen, setIsOpen, close, toggle }),
    [isOpen, close, toggle]
  );

  return (
    <SidebarLayoutContext.Provider value={value}>
      {children}
    </SidebarLayoutContext.Provider>
  );
};

export const useSidebarLayout = () => useContext(SidebarLayoutContext);
