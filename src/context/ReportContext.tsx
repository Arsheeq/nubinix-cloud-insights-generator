
import React, { createContext, useContext, useState } from "react";
import {
  CloudCredentials,
  CloudProvider,
  Instance,
  RDSInstance,
  ReportConfig,
  ReportFrequency
} from "@/types";

interface ReportContextType {
  provider: CloudProvider | null;
  setProvider: (provider: CloudProvider) => void;
  credentials: CloudCredentials | null;
  setCredentials: (credentials: CloudCredentials) => void;
  instances: Instance[];
  setInstances: (instances: Instance[]) => void;
  rdsInstances: RDSInstance[];
  setRdsInstances: (rdsInstances: RDSInstance[]) => void;
  selectedInstances: Instance[];
  selectedRdsInstances: RDSInstance[];
  toggleInstanceSelection: (id: string) => void;
  toggleRdsInstanceSelection: (id: string) => void;
  selectAllInstances: (selected: boolean) => void;
  selectAllRdsInstances: (selected: boolean) => void;
  frequency: ReportFrequency;
  setFrequency: (frequency: ReportFrequency) => void;
  resetReport: () => void;
  reportConfig: ReportConfig | null;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<CloudProvider | null>(null);
  const [credentials, setCredentials] = useState<CloudCredentials | null>(null);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [rdsInstances, setRdsInstances] = useState<RDSInstance[]>([]);
  const [frequency, setFrequency] = useState<ReportFrequency>("daily");

  const toggleInstanceSelection = (id: string) => {
    setInstances(
      instances.map((instance) =>
        instance.id === id ? { ...instance, selected: !instance.selected } : instance
      )
    );
  };

  const toggleRdsInstanceSelection = (id: string) => {
    setRdsInstances(
      rdsInstances.map((instance) =>
        instance.id === id ? { ...instance, selected: !instance.selected } : instance
      )
    );
  };

  const selectAllInstances = (selected: boolean) => {
    setInstances(instances.map((instance) => ({ ...instance, selected })));
  };

  const selectAllRdsInstances = (selected: boolean) => {
    setRdsInstances(rdsInstances.map((instance) => ({ ...instance, selected })));
  };

  const resetReport = () => {
    setProvider(null);
    setCredentials(null);
    setInstances([]);
    setRdsInstances([]);
    setFrequency("daily");
  };

  const selectedInstances = instances.filter((instance) => instance.selected);
  const selectedRdsInstances = rdsInstances.filter((instance) => instance.selected);

  // Combine all data into a report configuration
  const reportConfig = provider && credentials 
    ? {
        provider,
        credentials,
        instances: selectedInstances,
        rdsInstances: selectedRdsInstances,
        frequency,
      }
    : null;

  return (
    <ReportContext.Provider
      value={{
        provider,
        setProvider,
        credentials,
        setCredentials,
        instances,
        setInstances,
        rdsInstances,
        setRdsInstances,
        selectedInstances,
        selectedRdsInstances,
        toggleInstanceSelection,
        toggleRdsInstanceSelection,
        selectAllInstances,
        selectAllRdsInstances,
        frequency,
        setFrequency,
        resetReport,
        reportConfig
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = () => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error("useReport must be used within a ReportProvider");
  }
  return context;
};
