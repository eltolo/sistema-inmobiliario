export interface AgencyConfig {
  agency_name: string;
  whatsapp: string;
  whatsapp_claudia?: string;
  email: string;
  address: string;
  instagram: string;
  instagram_account_id?: string;
  instagram_access_token?: string;
}

export interface Property {
  id: string;
  title: string;
  address: string;
  neighborhood: string;
  price: string;
  expenses: string;
  type: string;
  operation: string;
  status: string;
  total_area: string;
  covered_area: string;
  rooms: string;
  bedrooms: string;
  location: string;
  orientation: string;
  age: string;
  description: string;
  bathrooms: string;
  luminoso: string;
  images: string[];
  audio?: string | null;
  map?: string | null;
  instagram_card?: string | null;
  instagram_caption?: string | null;
}

export interface WebData {
  config: AgencyConfig;
  properties: Property[];
}
