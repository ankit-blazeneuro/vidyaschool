export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  image: string | null;
}

export interface Session {
  token: string;
  expiresAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User | null;
  token: string | null;
  session?: Session | null;
  message?: string | null;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: string;
}

export interface SignupResponse {
  user: User | null;
  token: string | null;
  message?: string | null;
}

export interface UserRoleResponse {
  role: string;
  name: string | null;
  image: string | null;
  student_class: string | null;
}

export interface CreateSessionRequest {
  email: string;
}

export interface SessionDetails {
  id: string;
  token: string;
  expiresAt: string;
}

export interface CreateSessionResponse {
  success: boolean;
  session: SessionDetails | null;
}

export interface VerifySessionResponse {
  valid: boolean;
  role: string | null;
  name: string | null;
  image: string | null;
  student_class: string | null;
  username: string | null;
}

export interface SliderImage {
  id: number;
  url: string;
  title: string;
  enabled: boolean;
  target_audience: string;
  target_classes: string;
}

export interface UpdateSliderImagesResponse {
  success: boolean;
  images: SliderImage[];
}

export interface FeeInstallment {
  id: string;
  user_id: string;
  month: string;
  year: string;
  amount: number;
  due_date: string | null;
  status: string;
  paid_date: string | null;
  receipt_no: string | null;
  payment_method: string | null;
  qr_data_url: string | null;
}

export interface PayFeesRequest {
  installment_ids: string[];
  payment_method?: string | null;
}

export interface PayFeesResponse {
  success: boolean;
  receipt_no: string | null;
  paid_date: string | null;
}

export interface CreateOrderRequest {
  installment_ids: string[];
  amount: number;
  receipt?: string | null;
}

export interface CreateOrderResponse {
  order_id: string | null;
  amount: number | null;
  currency: string | null;
  receipt: string | null;
  installment_ids: string[] | null;
  key_id: string | null;
  mock_payment?: boolean | null;
}

export interface VerifyPaymentRequest {
  order_id: string;
  payment_id: string;
  signature: string;
  installment_ids: string[];
  payment_method?: string;
}

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export interface SearchUserResponse {
  name: string;
  username: string;
  role: string;
}

export interface UserProfileData {
  id: string | null;
  user_id: string | null;
  admissionNumber: string | null;
  username: string | null;
  phoneNumber: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  class: string | null;
  section: string | null;
  secondaryRole: string | null;
  transportMode: string | null;
  onboardingCompleted: boolean | null;
  classSectionLastUpdated: string | null;
  classSectionChanges: string | null;
}

export interface ProfileResponse {
  user: User;
  profile: UserProfileData | null;
}

export interface ProfileUpdateRequest {
  username?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  class?: string | null;
  section?: string | null;
}

export interface OnboardingStatusResponse {
  onboardingCompleted: boolean;
}

export interface OnboardingSubmitRequest {
  admissionNumber?: string | null;
  username: string;
  phoneNumber?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  class?: string | null;
  section?: string | null;
  transportMode?: string | null;
}

export interface StudentBorrowingResponse {
  id: string;
  bookId: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  renewalsCount: number;
  status: string;
  title: string;
  author: string;
  isbn: string;
}

export interface StudentRenewRequest {
  id: string;
}

export interface NoticeResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  isUrgent: boolean;
  senderId: string | null;
  targetRole: string | null;
  targetClass: string | null;
  targetSection: string | null;
  createdAt: string;
  senderName: string | null;
}

export interface SearchBackendResponse {
  id: string;
  title: string;
  content: string;
  url: string;
}

export interface DocMarkdownResponse {
  title: string;
  markdown: string;
}
