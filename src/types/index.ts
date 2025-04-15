
export interface CloudCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  accountId?: string;
}

export interface Instance {
  id: string;
  name: string;
  type: string;
  region: string;
  state: "running" | "stopped" | "terminated" | "pending";
  selected: boolean;
}

export interface RDSInstance {
  id: string;
  name: string;
  engine: string;
  region: string;
  state: "available" | "stopped" | "creating" | "deleting";
  selected: boolean;
}

export type CloudProvider = "aws" | "azure";
export type ReportFrequency = "daily" | "weekly" | "monthly";

export interface ReportConfig {
  provider: CloudProvider;
  credentials: CloudCredentials;
  instances: Instance[];
  rdsInstances: RDSInstance[];
  frequency: ReportFrequency;
}
