'use client'

import { useEffect } from 'react'
import { useCompanyProfile } from '@/hooks/useCompanyProfile'
import ImpersonationBanner from '@/components/admin/ImpersonationBanner'

interface CompanyLayoutWrapperProps {
  children: React.ReactNode
}

export default function CompanyLayoutWrapper({ children }: CompanyLayoutWrapperProps) {
  const { profile, loading } = useCompanyProfile()

  useEffect(() => {
    if (!loading && profile) {
      // Update document title
      document.title = `${profile.company_name} - Admin Panel`

      // Update favicon
      const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      const existingAppleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement
      
      if (existingFavicon) {
        existingFavicon.href = profile.favicon_url
      } else {
        const favicon = document.createElement('link')
        favicon.rel = 'icon'
        favicon.href = profile.favicon_url
        document.head.appendChild(favicon)
      }

      if (existingAppleIcon) {
        existingAppleIcon.href = profile.favicon_url
      } else {
        const appleIcon = document.createElement('link')
        appleIcon.rel = 'apple-touch-icon'
        appleIcon.href = profile.favicon_url
        document.head.appendChild(appleIcon)
      }

      // Update meta tags
      let descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement
      if (!descriptionMeta) {
        descriptionMeta = document.createElement('meta')
        descriptionMeta.name = 'description'
        document.head.appendChild(descriptionMeta)
      }
      descriptionMeta.content = profile.description || `${profile.company_name} - Admin Panel`

      // Update company name in various meta tags
      let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement
      if (!ogTitle) {
        ogTitle = document.createElement('meta')
        ogTitle.setAttribute('property', 'og:title')
        document.head.appendChild(ogTitle)
      }
      ogTitle.content = `${profile.company_name} - Admin Panel`

      let ogDescription = document.querySelector('meta[property="og:description"]') as HTMLMetaElement
      if (!ogDescription) {
        ogDescription = document.createElement('meta')
        ogDescription.setAttribute('property', 'og:description')
        document.head.appendChild(ogDescription)
      }
      ogDescription.content = profile.description || `${profile.company_name} Admin Panel`

      // Update Twitter meta tags
      let twitterTitle = document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta')
        twitterTitle.name = 'twitter:title'
        document.head.appendChild(twitterTitle)
      }
      twitterTitle.content = `${profile.company_name} - Admin Panel`
    }
  }, [profile, loading])

  return (
    <>
      <ImpersonationBanner />
      {children}
    </>
  )
}