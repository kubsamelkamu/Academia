export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  tenantId: string;
}

export interface RegisterInstitutionDto {
  universityName: string;
  departmentName: string;
  departmentCode: string;
  departmentDescription?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  institution: {
    id: string;
    name: string;
    domain: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
  departmentHead: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  nextSteps: string[];
}

export interface VerifyEmailOtpDto {
  email: string;
  otp: string;
  tenantDomain?: string;
}

export interface ResendEmailOtpDto {
  email: string;
  tenantDomain?: string;
}

export interface LoginDto {
  email: string;
  password: string;
  tenantDomain?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  message: string | string[];
  error: {
    code: string;
  };
  timestamp: string;
  path: string;
}