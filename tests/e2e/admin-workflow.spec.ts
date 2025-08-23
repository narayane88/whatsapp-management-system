import { test, expect } from '@playwright/test'

test.describe('Admin Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000')
  })

  test('should complete full admin login and dashboard workflow', async ({ page }) => {
    // Test login flow
    await page.click('text=Sign In')
    await page.fill('input[name="email"]', 'owner@demo.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')

    // Wait for redirect to admin dashboard
    await expect(page).toHaveURL('/admin')
    
    // Verify admin dashboard elements
    await expect(page.locator('h1')).toContainText('Welcome back')
    await expect(page.locator('text=Total Users')).toBeVisible()
    await expect(page.locator('text=Messages Sent')).toBeVisible()
    await expect(page.locator('text=Total Revenue')).toBeVisible()
    await expect(page.locator('text=Active Servers')).toBeVisible()
  })

  test('should navigate through admin sections', async ({ page }) => {
    // Login first
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'owner@demo.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/admin')

    // Test navigation to Users
    await page.click('text=Users')
    await expect(page).toHaveURL('/admin/users')
    await expect(page.locator('text=User Management')).toBeVisible()

    // Test navigation to Packages
    await page.click('text=Packages')
    await expect(page).toHaveURL('/admin/packages')
    await expect(page.locator('text=Package Management')).toBeVisible()

    // Test navigation to Vouchers
    await page.click('text=Vouchers')
    await expect(page).toHaveURL('/admin/vouchers')
    await expect(page.locator('text=Voucher Management')).toBeVisible()

    // Test navigation to Transactions
    await page.click('text=Transactions')
    await expect(page).toHaveURL('/admin/transactions')
    await expect(page.locator('text=Transaction Management')).toBeVisible()
  })

  test('should create new user as admin', async ({ page }) => {
    // Login as owner
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'owner@demo.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Navigate to users page
    await page.click('text=Users')
    await expect(page).toHaveURL('/admin/users')
    
    // Click Add User button
    await page.click('text=Add User')
    
    // Fill user form
    await page.fill('input[placeholder="Enter full name"]', 'Test New User')
    await page.fill('input[placeholder="Enter email address"]', 'newuser@test.com')
    await page.fill('input[placeholder="Enter mobile number"]', '+1234567899')
    await page.selectOption('select', 'CUSTOMER')
    await page.fill('input[placeholder="Enter password"]', 'testpass123')
    
    // Submit form
    await page.click('text=Create User')
    
    // Verify success message or user appearance
    await expect(page.locator('text=User created')).toBeVisible({ timeout: 5000 })
  })

  test('should create new package as owner', async ({ page }) => {
    // Login as owner
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'owner@demo.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Navigate to packages page
    await page.click('text=Packages')
    await expect(page).toHaveURL('/admin/packages')
    
    // Click Create Package button
    await page.click('text=Create Package')
    
    // Fill package form
    await page.fill('input[placeholder="Enter package name"]', 'Test Package')
    await page.fill('input[step="0.01"]', '49.99') // Price input
    await page.fill('textarea[placeholder="Enter package description"]', 'Test package description')
    
    // Submit form
    await page.click('text=Create Package')
    
    // Verify success
    await expect(page.locator('text=Package created')).toBeVisible({ timeout: 5000 })
  })

  test('should create voucher with validation', async ({ page }) => {
    // Login as owner
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'owner@demo.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Navigate to vouchers page
    await page.click('text=Vouchers')
    await expect(page).toHaveURL('/admin/vouchers')
    
    // Click Create Voucher button
    await page.click('text=Create Voucher')
    
    // Generate voucher code
    await page.click('text=Generate')
    
    // Fill voucher form
    await page.selectOption('select', 'CREDIT')
    await page.fill('input[step="0.01"]', '100.00')
    
    // Set expiry date (future date)
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + 1)
    await page.fill('input[type="date"]', futureDate.toISOString().split('T')[0])
    
    // Submit form
    await page.click('text=Create Voucher')
    
    // Verify success
    await expect(page.locator('text=Voucher created')).toBeVisible({ timeout: 5000 })
  })

  test('should handle role-based access control', async ({ page }) => {
    // Test SubDealer access
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'subdealer@demo.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Should be on admin page
    await expect(page).toHaveURL('/admin')
    
    // Should be able to access Users
    await page.click('text=Users')
    await expect(page).toHaveURL('/admin/users')
    
    // Should NOT be able to access Packages (owner only)
    const packagesLink = page.locator('text=Packages')
    await expect(packagesLink).not.toBeVisible()
  })

  test('should test customer dashboard access', async ({ page }) => {
    // Login as customer
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'customer@demo.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Should redirect to customer dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Verify customer dashboard elements
    await expect(page.locator('text=Welcome back')).toBeVisible()
    await expect(page.locator('text=Messages Sent')).toBeVisible()
    await expect(page.locator('text=Contacts')).toBeVisible()
    await expect(page.locator('text=Credits Balance')).toBeVisible()
  })

  test('should test WhatsApp services workflow', async ({ page }) => {
    // Login as customer
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'customer@demo.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Navigate to WhatsApp services
    await page.click('text=WhatsApp Services')
    await expect(page).toHaveURL('/dashboard/whatsapp')
    
    // Verify WhatsApp instances are displayed
    await expect(page.locator('text=Active Instances')).toBeVisible()
    await expect(page.locator('text=Messages Sent')).toBeVisible()
    
    // Test Add Instance button
    await page.click('text=Add Instance')
    
    // Fill instance form
    await page.fill('input[placeholder="Enter instance name"]', 'Test WhatsApp Instance')
    
    // Submit
    await page.click('text=Create Instance')
    
    // Verify success
    await expect(page.locator('text=Instance created')).toBeVisible({ timeout: 5000 })
  })

  test('should test message sending workflow', async ({ page }) => {
    // Login as customer
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'customer@demo.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Navigate to WhatsApp services
    await page.click('text=WhatsApp Services')
    
    // Click Send Message
    await page.click('text=Send Message')
    
    // Fill message form
    await page.selectOption('select[placeholder="Select instance"]', { index: 0 })
    await page.fill('input[placeholder="+1234567890"]', '+1987654321')
    await page.fill('textarea[placeholder="Enter your message..."]', 'Test message from E2E')
    
    // Submit
    await page.click('button:has-text("Send Message")')
    
    // Verify success
    await expect(page.locator('text=Message sent')).toBeVisible({ timeout: 5000 })
  })

  test('should test theme switching', async ({ page }) => {
    // Login
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'owner@demo.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Click theme toggle
    const themeToggle = page.locator('[aria-label="toggle color mode"]')
    await themeToggle.click()
    
    // Verify theme change (check for dark mode classes or styles)
    await expect(page.locator('body')).toHaveClass(/chakra-ui-dark/)
  })

  test('should test logout functionality', async ({ page }) => {
    // Login
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'owner@demo.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await expect(page).toHaveURL('/admin')
    
    // Click user menu
    await page.click('[aria-label="User menu"]')
    
    // Click sign out
    await page.click('text=Sign out')
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/signin')
  })

  test('should handle error scenarios', async ({ page }) => {
    // Test invalid login
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 })
    
    // Should remain on login page
    await expect(page).toHaveURL('/auth/signin')
  })

  test('should test responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Login
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'owner@demo.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Mobile menu should be visible
    const mobileMenuButton = page.locator('[aria-label="open menu"]')
    await expect(mobileMenuButton).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    
    // Desktop sidebar should not be visible on tablet
    const desktopSidebar = page.locator('nav').first()
    await expect(desktopSidebar).not.toBeVisible()
  })

  test('should test search and filtering', async ({ page }) => {
    // Login as owner
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'owner@demo.com')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Navigate to users
    await page.click('text=Users')
    
    // Test search functionality
    await page.fill('input[placeholder="Search users..."]', 'John')
    
    // Wait for search results
    await expect(page.locator('text=John')).toBeVisible()
    
    // Test role filtering
    await page.selectOption('select', 'CUSTOMER')
    
    // Verify filtered results
    await expect(page.locator('text=CUSTOMER')).toBeVisible()
  })
})