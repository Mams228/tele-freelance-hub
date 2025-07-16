export interface Service {
  id: string;
  name: string;
  description: string;
  price_from: number;
  category: string;
  icon_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  telegram_user_id: string;
  customer_name: string;
  contact_info: string;
  service_id: string;
  deadline: string;
  notes: string | null;
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  work_notes: string | null;
  work_link: string | null;
  created_at: string;
  updated_at: string;
  service?: Service;
}

export interface Profile {
  id: string;
  telegram_user_id: string;
  name: string;
  role: 'client' | 'freelancer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface OrderFormData {
  service_id: string;
  contact_info: string;
  deadline: string;
  notes: string;
}