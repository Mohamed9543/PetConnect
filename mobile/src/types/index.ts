export type AnimalType = "dog" | "cat" | "other";
export type Gender = "male" | "female";
export type AgeCategory = "baby" | "young" | "adult";
export type ReportStatus = "active" | "in_progress" | "found" | "resolved";
export type UserRole = "user" | "association" | "admin";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  city?: string;
  phone?: string;
  role: UserRole;
  rating?: number;
  organizationName?: string;
  organizationDescription?: string;
  verified?: boolean;
  isBlocked?: boolean;
  createdAt?: string;
  token?: string;
}

export interface AdminStats {
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

export interface Flag {
  _id: string;
  reporter: User;
  targetType: "user" | "animal" | "report" | "message";
  targetId: string;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

export interface Animal {
  _id: string;
  name: string;
  type: AnimalType;
  breed?: string;
  gender: Gender;
  age: number;
  ageCategory: AgeCategory;
  color?: string;
  description?: string;
  images: string[];
  location: { latitude?: number; longitude?: number; city?: string };
  vaccinated: boolean;
  status: "available" | "pending" | "adopted";
  owner: User;
  createdAt: string;
}

export interface Report {
  _id: string;
  reference: string;
  type: "lost" | "found";
  animalName?: string;
  animalType: AnimalType;
  breed?: string;
  color?: string;
  gender?: Gender | "unknown";
  description?: string;
  images: string[];
  location: { latitude: number; longitude: number; address?: string };
  date: string;
  contact: string;
  status: ReportStatus;
  statusHistory?: { status: ReportStatus; changedAt: string }[];
  user: User;
  createdAt: string;
}
