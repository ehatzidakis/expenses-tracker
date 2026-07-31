export interface Adjustment {
  id: string;
  title: string;
  adjType: 'income' | 'expense';
  amount: number;
  date: Date;
}
