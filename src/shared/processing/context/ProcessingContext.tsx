import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';

export interface ProcessingState {
  percent: number;
  isBusy: boolean;
  setPercent: Dispatch<SetStateAction<number>>;
  setIsBusy: Dispatch<SetStateAction<boolean>>;
}

const ProcessingContext = createContext<ProcessingState | undefined>(undefined);

export const ProcessingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [percent, setPercent] = useState(0);
  const [isBusy, setIsBusy] = useState(false);

  return (
    <ProcessingContext.Provider value={{ percent, isBusy, setPercent, setIsBusy }}>
      {children}
    </ProcessingContext.Provider>
  );
};

export const useProcessingContext = (): ProcessingState => {
  const ctx = useContext(ProcessingContext);
  if (!ctx) {
    throw new Error('[useProcessingContext] useProcessingContext must be used within a ProcessingProvider');
  }
  return ctx;
};
