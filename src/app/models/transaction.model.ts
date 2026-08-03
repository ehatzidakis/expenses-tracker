export interface Transaction {
  id: string;
  monthName: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  createdAt: string;
  adjustmentId?: string;
}
