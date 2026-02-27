export type TenantAddress = {
  country: string | null
  city: string | null
  region: string | null
  phone: string | null
  website: string | null
}

export type TenantBranding = {
  logoUrl: string | null
  logoPublicId: string | null
}

export type TenantUniversityConfig = {
  type: "university"
  address: TenantAddress
  branding?: TenantBranding | null
  onboardingComplete: boolean
}

export type TenantCurrent = {
  id: string
  name: string
  domain: string
  status: string
  config: TenantUniversityConfig
  createdAt?: string
  updatedAt?: string
}

export type UpdateTenantAddressDto = Partial<{
  country: string
  city: string
  region: string
  phone: string
  website: string
}>
