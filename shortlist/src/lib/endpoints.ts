import { request, tokenStore } from "./api";
import type {
  AppNotification, AdminCompany, AdminUser, Application, ChatMessage, Company, Job, JobLocation, Pagination,
  SeniorityLevel, User, WorkingTime, EmployeeRange,
} from "./types";

interface Envelope<T> { message: string; data: T }
const unwrap = async <T>(p: Promise<Envelope<T>>) => (await p).data;

/* ───────── auth ───────── */
export const authApi = {
  signup: (b: { username: string; email: string; password: string; mobileNumber: string }) =>
    request<Envelope<unknown>>("/api/v1/auth/signup", { method: "POST", json: b, auth: false }),
  confirmEmail: (b: { email: string; otp: string }) =>
    request<Envelope<unknown>>("/api/v1/auth/confirmEmail", { method: "POST", json: b, auth: false }),
  resendOtp: (email: string) =>
    request<Envelope<unknown>>("/api/v1/auth/resend-otp", { method: "POST", json: { email }, auth: false }),
  login: (b: { email: string; password: string }) =>
    unwrap(request<Envelope<{ credentials: { accessToken: string; refreshToken: string } }>>(
      "/api/v1/auth/login", { method: "POST", json: b, auth: false })),
  /** Existing Google accounts get credentials. A brand-new account is created and the caller must sign in once more. */
  google: (idToken: string) =>
    request<Envelope<{ credentials?: { accessToken: string; refreshToken?: string } }>>(
      "/api/v1/auth/google/login", { method: "POST", json: { idToken }, auth: false }),
  forgotPassword: (email: string) =>
    request<Envelope<unknown>>("/api/v1/auth/forget-password", { method: "POST", json: { email }, auth: false }),
  resetPassword: (b: { email: string; otp: string; newPassword: string }) =>
    request<Envelope<unknown>>("/api/v1/auth/reset-password", { method: "PATCH", json: b, auth: false }),
};

/* ───────── user ───────── */
export const userApi = {
  me: () => unwrap(request<Envelope<{ user: User }>>("/api/v1/user/getLoginUser", { method: "POST" })).then((d) => d.user),
  update: (b: { firstName?: string; lastName?: string; mobileNumber?: string; DOB: string; gender?: "MALE" | "FEMALE" }) =>
    unwrap(request<Envelope<{ updatedUser: User }>>("/api/v1/user/update-profile", { method: "PATCH", json: b })),
  updatePassword: (b: { oldPassword: string; newPassword: string }) =>
    request<Envelope<unknown>>("/api/v1/user/update-password", { method: "PATCH", json: b }),
  uploadProfilePic: (file: File) => {
    const form = new FormData(); form.append("image", file);
    return request<Envelope<unknown>>("/api/v1/user/upload-pic", { method: "POST", form });
  },
  deleteProfilePic: () => request<Envelope<unknown>>("/api/v1/user/delete-profile-pic", { method: "DELETE" }),
  uploadCovers: (files: File[]) => {
    const form = new FormData(); files.forEach((f) => form.append("images", f));
    return request<Envelope<unknown>>("/api/v1/user/cover-pic", { method: "POST", form });
  },
  deleteCover: (public_id: string) => request<Envelope<unknown>>("/api/v1/user/delete-cover-pic", { method: "DELETE", json: { public_id } }),
  softDelete: () => request<Envelope<unknown>>("/api/v1/user/soft-delete", { method: "PATCH" }),
};

/* ───────── jobs ───────── */
export interface JobSearch {
  page: number;
  limit: number;
  jobTitle?: string;
  jobLocation?: JobLocation | "";
  workingTime?: WorkingTime | "";
  seniorityLevel?: SeniorityLevel | "";
  technicalSkills?: string;
}

export interface JobInput {
  jobTitle: string;
  jobLocation: JobLocation;
  workingTime: WorkingTime;
  seniorityLevel: SeniorityLevel;
  jobDescription: string;
  technicalSkills: string[];
  softSkills: string[];
}

export const jobApi = {
  /** The backend nests the list under data.pagination.jobs. */
  search: async (q: JobSearch) => {
    const d = await unwrap(request<Envelope<{ pagination: Pagination & { jobs: Job[] } }>>("/api/v1/job/get-match", { query: { ...q } }));
    const { jobs, ...pagination } = d.pagination;
    return { jobs, pagination: pagination as Pagination };
  },
  apply: (jobId: string, cv: File) => {
    const form = new FormData(); form.append("cv", cv);
    return request<Envelope<unknown>>(`/api/v1/job/apply-job/${jobId}`, { method: "POST", form });
  },
  add: (companyId: string, b: JobInput) =>
    request<Envelope<{ job: Job }>>(`/api/v1/company/${companyId}/jobs/add-job`, { method: "POST", json: b }),
  update: (companyId: string, jobId: string, b: Partial<JobInput> & { closed?: boolean }) =>
    request<Envelope<{ job: Job }>>(`/api/v1/company/${companyId}/jobs/update-job/${jobId}`, { method: "PATCH", json: b }),
  remove: (companyId: string, jobId: string) =>
    request<Envelope<unknown>>(`/api/v1/company/${companyId}/jobs/delete-job/${jobId}`, { method: "DELETE" }),
  /** page and limit are always sent: the backend does not default them on this route. */
  applications: (companyId: string, jobId: string, page = 1, limit = 10) =>
    unwrap(request<Envelope<{ applications: Application[]; pagination: Pagination }>>(
      `/api/v1/company/${companyId}/jobs/get-applications/${jobId}`, { query: { page, limit } })),
  setStatus: (companyId: string, applicationId: string, status: "accepted" | "rejected") =>
    request<Envelope<unknown>>(`/api/v1/company/${companyId}/jobs/status-application/${applicationId}`, { method: "PATCH", json: { status } }),
};

/* ───────── companies ───────── */
export interface CompanyInput {
  companyName: string;
  description: string;
  industry: string;
  address: string;
  numberOfEmployees: EmployeeRange;
  companyEmail: string;
}

export const companyApi = {
  /**
   * There is no "list companies" endpoint. Searching for "." matches every name
   * because the backend runs it as a case-insensitive regex.
   */
  all: () => unwrap(request<Envelope<{ companies: Company[] }>>("/api/v1/company/search", { query: { name: "." } })).then((d) => d.companies),
  get: (id: string) => unwrap(request<Envelope<{ company: Company }>>(`/api/v1/company/get-company/${id}`)).then((d) => d.company),
  add: (b: CompanyInput) => unwrap(request<Envelope<{ newCompany: Company }>>("/api/v1/company/add-company", { method: "POST", json: b })),
  update: (id: string, b: Partial<CompanyInput>) =>
    request<Envelope<unknown>>(`/api/v1/company/update-company/${id}`, { method: "PATCH", json: b }),
  remove: (id: string) => request<Envelope<unknown>>(`/api/v1/company/delete-company/${id}`, { method: "PATCH" }),
  uploadLogo: (id: string, file: File) => {
    const form = new FormData(); form.append("image", file);
    return request<Envelope<unknown>>(`/api/v1/company/upload-logo/${id}`, { method: "PATCH", form });
  },
  deleteLogo: (id: string) => request<Envelope<unknown>>(`/api/v1/company/delete-logo/${id}`, { method: "DELETE" }),
  uploadCovers: (id: string, files: File[]) => {
    const form = new FormData(); files.forEach((f) => form.append("images", f));
    return request<Envelope<unknown>>(`/api/v1/company/upload-cover-pics/${id}`, { method: "POST", form });
  },
  deleteCover: (id: string, public_id: string) =>
    request<Envelope<unknown>>(`/api/v1/company/delete-cover-pic/${id}`, { method: "DELETE", json: { public_id } }),
  exportApplications: (id: string, date: string) =>
    request<Blob>(`/api/v1/company/export-applicatios/${id}`, { query: { date }, blob: true }),
};

/* ───────── chat ───────── */
export const chatApi = {
  history: async (userId: string) => {
    const d = await unwrap(request<Envelope<{ chat?: { _id: string; messages: ChatMessage[] }; messages?: ChatMessage[] }>>(`/api/v1/chat/${userId}`));
    return { chatId: d.chat?._id ?? null, messages: d.chat?.messages ?? d.messages ?? [] };
  },
};

/* ───────── notifications ───────── */
export const notificationApi = {
  list: (q: { page: number; limit: number; isRead?: boolean }) =>
    unwrap(request<Envelope<{ notifications: AppNotification[]; pagination: { page: number; limit: number; total: number; pages: number } }>>(
      "/api/v1/notification/notifications", { query: { page: q.page, limit: q.limit, isRead: q.isRead === undefined ? undefined : String(q.isRead) } })),
  unreadCount: () => unwrap(request<Envelope<{ count: number }>>("/api/v1/notification/unread-count")).then((d) => d.count),
  markRead: (id: string) => request<Envelope<unknown>>(`/api/v1/notification/mark-as-read/${id}`, { method: "PATCH" }),
  markAllRead: () => request<Envelope<unknown>>("/api/v1/notification/mark-all-read", { method: "PATCH" }),
  remove: (id: string) => request<Envelope<unknown>>(`/api/v1/notification/${id}`, { method: "DELETE" }),
};

/* ───────── admin ───────── */
async function graphql<T>(query: string): Promise<T> {
  const res = await request<{ data?: T; errors?: { message: string }[] }>("/graphql", { method: "POST", json: { query } });
  if (res.errors?.length) throw new Error(res.errors[0].message);
  return res.data as T;
}

export const adminApi = {
  overview: () =>
    graphql<{ users: AdminUser[]; companies: AdminCompany[] }>(`{
      users { id firstName lastName email role isConfirmed bannedAt deletedAt createdAt profilePic { secure_url } }
      companies { id companyName industry companyEmail approvedByAdmin bannedAt deletedAt logo { secure_url } }
    }`),
  banUser: (id: string) => request<Envelope<unknown>>(`/admin/users/banUnbanUser/${id}`, { method: "PATCH" }),
  banCompany: (id: string) => request<Envelope<unknown>>(`/admin/companies/banUnbanCompany/${id}`, { method: "PATCH" }),
  approveCompany: (id: string) => request<Envelope<unknown>>(`/admin/companies/approve-company/${id}`, { method: "PATCH" }),
};

export { tokenStore };
