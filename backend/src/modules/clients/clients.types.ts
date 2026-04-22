/**
 * ============================================
 * CLIENT PORTAL TYPES
 * ============================================
 */

export interface CreateClientRequest {
  email: string;
  password: string;
  name: string;
  businessName?: string;
  businessType?: string;
  gstNumber?: string;
  panNumber?: string;
  contactPerson?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  registrationMethod?: 'ADMIN_CREATED' | 'SELF_REGISTERED';
}

export interface UpdateClientRequest {
  businessName?: string;
  businessType?: string;
  gstNumber?: string;
  panNumber?: string;
  contactPerson?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  notifyByEmail?: boolean;
  notifyBySms?: boolean;
  notifyByWhatsApp?: boolean;
}

export interface ApproveClientRequest {
  clientId: string;
  approved: boolean;
  rejectionReason?: string;
}

export interface ClientOrderRequest {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  productPhotoUrl?: string;
  priority?: number;
  goldWeightInitial?: number;
  purity: number;
  goldColor?: string;
  metalType?: string;
  size?: string;
  quantity?: number;
  productType?: string;
  dueDate: Date;
  additionalDescription?: string;
  specialInstructions?: string;
  referenceImages?: string[];
}

export interface OrderCommentRequest {
  orderId: string;
  message: string;
  attachments?: string[];
  isInternal?: boolean;
}
