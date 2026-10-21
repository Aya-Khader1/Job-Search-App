export type Role = "USER" | "ADMIN";

export interface Attachment {
  secure_url: string;
  public_id: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  role: Role;
  gender?: "MALE" | "FEMALE";
  DOB?: string;
  mobileNumber?: string;
  provider?: "SYSTEM" | "GOOGLE";
  profilePic?: Partial<Attachment>;
  coverPic?: Attachment[];
}

export const JOB_LOCATIONS = ["onsite", "remotely", "hybrid"] as const;
export const WORKING_TIMES = ["full-time", "part-time"] as const;
export const SENIORITY_LEVELS = ["fresh", "junior", "mid-level", "senior", "team-lead", "cto"] as const;
export const EMPLOYEE_RANGES = ["1-10", "11-20", "21-50", "51-100", "101-500", "500+"] as const;

export type JobLocation = (typeof JOB_LOCATIONS)[number];
export type WorkingTime = (typeof WORKING_TIMES)[number];
export type SeniorityLevel = (typeof SENIORITY_LEVELS)[number];
export type EmployeeRange = (typeof EMPLOYEE_RANGES)[number];

export interface Job {
  _id: string;
  jobTitle: string;
  jobLocation: JobLocation;
  workingTime: WorkingTime;
  jobDescription: string;
  seniorityLevel: SeniorityLevel;
  technicalSkills: string[];
  softSkills: string[];
  companyId: string;
  addedBy: string;
  closed?: boolean;
  createdAt?: string;
}

export interface Company {
  _id: string;
  companyName: string;
  description: string;
  industry: string;
  address: string;
  numberOfEmployees: EmployeeRange;
  companyEmail: string;
  createdBy: string;
  HRs?: string[];
  logo?: Attachment;
  coverPic?: Attachment[];
  approvedByAdmin?: boolean;
  bannedAt?: string;
  jobs?: Job[];
}

export type ApplicationStatus = "pending" | "accepted" | "rejected" | string;

export interface ApplicantInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePic?: Partial<Attachment>;
}

export interface Application {
  _id: string;
  jobId: string;
  /** The backend stores the applicant id in userId; once populated it becomes an object. */
  userId: string | ApplicantInfo;
  user?: ApplicantInfo;
  userCV: Attachment;
  status: ApplicationStatus;
  createdAt: string;
}

export interface Pagination {
  totalJobs?: number;
  totalApplications?: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChatMessage {
  _id?: string;
  message: string;
  senderId: string | { _id: string; firstName?: string; lastName?: string; profilePic?: Partial<Attachment> };
  sentAt: string;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isConfirmed: boolean;
  bannedAt?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  profilePic?: { secure_url?: string } | null;
}

export interface AdminCompany {
  id: string;
  companyName: string;
  industry: string;
  companyEmail: string;
  approvedByAdmin: boolean;
  bannedAt?: string | null;
  deletedAt?: string | null;
  logo?: { secure_url?: string } | null;
}

export interface AppNotification {
  _id: string;
  /** The backend sends lowercase types today (new_application, application_status); compare case-insensitively. */
  type: string;
  title: string;
  message: string;
  data?: { jobId?: string; applicationId?: string; status?: string } | null;
  isRead: boolean;
  createdAt: string;
}
