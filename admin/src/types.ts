export interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "user" | "association" | "admin";
  isBlocked: boolean;
  verified: boolean;
  organizationName?: string;
  organizationDescription?: string;
  city?: string;
  phone?: string;
  createdAt: string;
}

export interface AdminAnimal {
  _id: string;
  name: string;
  type: string;
  status: string;
  images?: string[];
  owner: { firstName: string; lastName: string; email: string } | null;
  createdAt: string;
}

export interface AdminReport {
  _id: string;
  reference: string;
  type: "lost" | "found";
  animalType: string;
  animalName?: string;
  status: "active" | "in_progress" | "found" | "resolved";
  user: { firstName: string; lastName: string; email: string } | null;
  createdAt: string;
}

export interface AdminFlag {
  _id: string;
  targetType: "user" | "animal" | "report" | "message";
  targetId: string;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  reporter: { firstName: string; lastName: string } | null;
  createdAt: string;
}

export interface Stats {
  users: number;
  animals: number;
  adoptedAnimals: number;
  openReports: number;
  foundReports: number;
  associations: number;
  pendingFlags: number;
  adoptionRate: number;
  foundRate: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

export type TimeRange = "today" | "7d" | "30d" | "3m" | "1y";

export interface TimeseriesPoint {
  date: string;
  count: number;
}

export interface TimeseriesResponse {
  range: TimeRange;
  series: {
    users: TimeseriesPoint[];
    animals: TimeseriesPoint[];
    adoptions: TimeseriesPoint[];
    reports: TimeseriesPoint[];
  };
}

export interface AdoptionRequestSummary {
  _id: string;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  createdAt: string;
  animal: { _id: string; name: string; type: string; images?: string[] } | null;
}

export interface UserDetailResponse {
  user: AdminUser;
  animals: AdminAnimal[];
  reports: AdminReport[];
  adoptionRequests: AdoptionRequestSummary[];
}

export type ToastType = "success" | "error" | "warning";
