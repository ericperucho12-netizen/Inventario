export class CreateSaleDto {
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    presentationName?: string;
    multiplier?: number;
  }[];
  isCredit?: boolean;
  customerId?: string;
  paymentMethod?: string;
}
