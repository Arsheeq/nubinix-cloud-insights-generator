
export type CloudProvider = 'aws' | 'azure';

export const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)' },
  { value: 'ap-northeast-3', label: 'Asia Pacific (Osaka)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ca-central-1', label: 'Canada (Central)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-west-2', label: 'Europe (London)' },
  { value: 'eu-west-3', label: 'Europe (Paris)' },
  { value: 'eu-north-1', label: 'Europe (Stockholm)' },
  { value: 'me-south-1', label: 'Middle East (Bahrain)' },
  { value: 'me-central-1', label: 'Middle East (UAE)' },
  { value: 'sa-east-1', label: 'South America (São Paulo)' }
];

export interface Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  accountId?: string;
}

export interface Instance {
  id: string;
  name: string;
  region: string;
  state: 'running' | 'stopped' | 'terminated' | 'pending';
  type: string;
  selected: boolean;
}

export interface RDSInstance extends Instance {
  engine: string;
  size: string;
}

export type ReportFrequency = 'daily' | 'weekly' | 'monthly';

export type Step = 
  | 'cloudSelection' 
  | 'credentialsInput' 
  | 'instanceOverview' 
  | 'reportTypeSelection' 
  | 'reportGeneration';
