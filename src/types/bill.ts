import type { RSA } from "otb-toolkit/src/types";

export interface BillItem extends RSA {
  id: string;
  name: string;
  price: number | "";
}

export interface Bill extends RSA {
  id: string;
  name: string;
  items: BillItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DeletedBill extends Bill {
  deletedAt: string;
}

export interface LocalBillBackupData extends RSA {
  bills?: RSA[];
  deletedBills?: RSA[];
}
