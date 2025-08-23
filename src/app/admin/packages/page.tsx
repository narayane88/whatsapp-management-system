'use client'

import AdminLayout from '@/components/layout/AdminLayout'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
import PackageManagement from '@/components/admin/PackageManagement'

export default function PackagesPage() {
  return (
    <PagePermissionGuard requiredPermissions={['packages.page.access']}>
      <AdminLayout>
        <PackageManagement />
      </AdminLayout>
    </PagePermissionGuard>
  )
}