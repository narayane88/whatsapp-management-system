'use client'

import { useState, useEffect } from 'react'

interface PublicCompanyProfile {
  id?: number
  company_name: string
  email: string
  website: string
  mobile_number: string
  favicon_url: string
  light_logo_url: string
  dark_logo_url: string
  business_type: string
  description: string
  city?: string
  state?: string
  country?: string
}

const defaultProfile: PublicCompanyProfile = {
  company_name: 'Bizflash Insight Solution',
  email: 'admin@bizflash.in',
  website: 'https://bizflash.in',
  mobile_number: '8983063144',
  favicon_url: '/images/company/favicon.svg',
  light_logo_url: '/images/company/logo-light.svg',
  dark_logo_url: '/images/company/logo-dark.svg',
  business_type: 'Software Development & Digital Solutions',
  description: 'Bizflash Insight Solution is a leading technology company specializing in WhatsApp Business API solutions, custom software development, and digital transformation services.',
  city: 'Natpeute',
  state: 'Maharashtra',
  country: 'India'
}

export function usePublicCompanyProfile() {
  const [profile, setProfile] = useState<PublicCompanyProfile>(defaultProfile)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  console.log('🎯 Hook state - loading:', loading, 'profile.company_name:', profile.company_name)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      
      console.log('🔄 Fetching public company profile...')
      const response = await fetch('/api/company/profile/public')
      console.log('📡 API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 API Response data:', data)
        
        if (data.success) {
          const profileData = data.data
          console.log('✅ Profile data received:', profileData)
          
          // Use database values with fallbacks only for null/empty values
          const finalProfile = {
            id: profileData.id,
            company_name: profileData.company_name || defaultProfile.company_name,
            email: profileData.email || defaultProfile.email,
            website: profileData.website || defaultProfile.website,
            mobile_number: profileData.mobile_number || defaultProfile.mobile_number,
            favicon_url: profileData.favicon_url || defaultProfile.favicon_url,
            light_logo_url: profileData.light_logo_url || defaultProfile.light_logo_url,
            dark_logo_url: profileData.dark_logo_url || defaultProfile.dark_logo_url,
            business_type: profileData.business_type || defaultProfile.business_type,
            description: profileData.description || defaultProfile.description,
            city: profileData.city || defaultProfile.city,
            state: profileData.state || defaultProfile.state,
            country: profileData.country || defaultProfile.country
          }
          
          console.log('🎯 Final profile being set:', finalProfile)
          setProfile(finalProfile)
        } else {
          console.log('❌ API success=false, using defaults')
          // Use default profile if API fails
          setProfile(defaultProfile)
        }
      } else {
        console.log('❌ API response not ok, using defaults')
        // Use default profile for any API errors
        setProfile(defaultProfile)
      }
    } catch (error) {
      console.log('❌ Company profile fetch error (using defaults):', error)
      setProfile(defaultProfile)
      setError(null) // Don't show error, just use defaults
    } finally {
      setLoading(false)
      console.log('✅ Profile fetch completed')
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    // Debug helper
    profileDebug: {
      defaultName: defaultProfile.company_name,
      currentName: profile.company_name,
      isDefault: profile.company_name === defaultProfile.company_name
    }
  }
}

// Helper function to get just the company name
export function usePublicCompanyName() {
  const { profile } = usePublicCompanyProfile()
  return profile.company_name
}

// Helper function to get the appropriate logo based on theme
export function usePublicCompanyLogo(theme: 'light' | 'dark' = 'light') {
  const { profile } = usePublicCompanyProfile()
  return theme === 'dark' ? profile.dark_logo_url : profile.light_logo_url
}

// Helper function to get favicon
export function usePublicCompanyFavicon() {
  const { profile } = usePublicCompanyProfile()
  return profile.favicon_url
}