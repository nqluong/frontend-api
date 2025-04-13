export interface PaymentDetail {
  bookingId: number;
  roomName: string;
  checkIn: string;
  checkOut: string;
  roomPrice: number;
  totalDays: number;
  services: {
    serviceId: number;
    serviceName: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  totalServiceAmount: number;
  totalAmount: number;
}

export interface PaymentResponse {
  status: number;
  time: string;
  message: string;
  result: {
    paymentId: string;
    paymentUrl: string;
  }
} 