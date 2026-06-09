export interface BusinessRecord {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  type?: string;
  active?: boolean;
  [key: string]: unknown;
}
