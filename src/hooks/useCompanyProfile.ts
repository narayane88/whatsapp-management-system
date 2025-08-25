'use client'

import { useState, useEffect } from 'react'

interface CompanyProfile {
  id?: number
  company_name: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  mobile_number: string
  phone_number: string
  email: string
  website: string
  gstin_number: string
  pan_number: string
  favicon_url: string
  light_logo_url: string
  dark_logo_url: string
  established_year: number
  business_type: string
  description: string
  social_media?: {
    website?: string
    linkedin?: string
    twitter?: string
    facebook?: string
  }
  bank_details?: {
    bank_name?: string
    account_number?: string
    ifsc_code?: string
    branch?: string
  }
}

const defaultProfile: CompanyProfile = {
  company_name: 'Bizflash Insight Solution',
  address: 'Natpeute, Technology Hub',
  city: 'Natpeute',
  state: 'Maharashtra',
  country: 'India',
  postal_code: '413101',
  mobile_number: '8983063144',
  phone_number: '8983063144',
  email: 'admin@bizflash.in',
  website: 'https://bizflash.in',
  gstin_number: '27ABCDE1234F1Z5',
  pan_number: 'ABCDE1234F',
  favicon_url: '/images/company/favicon.svg',
  light_logo_url: '/images/company/logo-light.svg',
  dark_logo_url: '/images/company/logo-dark.svg',
  established_year: 2020,
  business_type: 'Software Development & Digital Solutions',
  description: 'Bizflash Insight Solution is a leading technology company specializing in WhatsApp Business API solutions, custom software development, and digital transformation services.',
  social_media: {
    website: 'https://bizflash.in',
    linkedin: 'https://linkedin.com/company/bizflash-insight-solution',
    twitter: 'https://twitter.com/bizflash',
    facebook: 'https://facebook.com/bizflash'
  },
  bank_details: {
    bank_name: 'State Bank of India',
    account_number: 'XXXXXXXXXXXX1234',
    ifsc_code: 'SBIN0012345',
    branch: 'Natpeute Branch'
  }
}

export function useCompanyProfile() {
  const [profile, setProfile] = useState<CompanyProfile>(defaultProfile)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      
      // First check if user has permission to access company profile
      const sessionResponse = await fetch('/api/auth/session')
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json()
        const userRole = sessionData?.user?.role?.toUpperCase()
        
        // Only try to fetch company profile for admin users
        if (userRole === 'CUSTOMER') {
          // Customers should use default profile without API call
          setProfile(defaultProfile)
          setLoading(false)
          return
        }
      }
      
      const response = await fetch('/api/company/profile')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const profileData = data.data
          setProfile({
            ...profileData,
            social_media: typeof profileData.social_media === 'string' 
              ? JSON.parse(profileData.social_media || '{}') 
              : profileData.social_media || {},
            bank_details: typeof profileData.bank_details === 'string' 
              ? JSON.parse(profileData.bank_details || '{}') 
              : profileData.bank_details || {}
          })
        } else {
          // Use default profile if API fails
          setProfile(defaultProfile)
        }
      } else {
        // Use default profile if not authenticated or other errors
        setProfile(defaultProfile)
      }
    } catch (error) {
      setProfile(defaultProfile)
      setError(null) // Don't show error, just use defaults
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile
  }
}

// Helper function to get just the company name
export function useCompanyName() {
  const { profile } = useCompanyProfile()
  return profile.company_name
}

// Helper function to get the appropriate logo based on theme
export function useCompanyLogo(theme: 'light' | 'dark' = 'light') {
  const { profile } = useCompanyProfile()
  return theme === 'dark' ? profile.dark_logo_url : profile.light_logo_url
}

// Helper function to get favicon
export function useCompanyFavicon() {
  const { profile } = useCompanyProfile()
  return profile.favicon_url
}