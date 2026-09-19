export class CreatePurchaseDto {
  supplierId: string;
  items: {
    productId: string;
    quantity: number;
    unitCost: number;
    newSellingPrice?: number;
  }[];
}
