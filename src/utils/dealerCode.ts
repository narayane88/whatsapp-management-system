/**
 * Dealer Code Management Utilities
 * Handles auto-generation, validation, and lookup of dealer codes
 */

export interface DealerCodeInfo {
  code: string
  dealerId: number
  dealerName: string
  email: string
  isActive: boolean
  createdAt: string
  customerCount: number
  totalRevenue: number
}

/**
 * Generate a unique dealer code
 * Format: WA-XXXX-YYYY where X is letters, Y is numbers
 */
export function generateDealerCode(dealerName: string, dealerId: number): string {
  // Extract initials from dealer name
  const nameInitials = dealerName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
    .padEnd(2, 'A')

  // Generate random letters (only A-Z)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const randomLetters = alphabet.charAt(Math.floor(Math.random() * 26)) + 
                       alphabet.charAt(Math.floor(Math.random() * 26))
  
  // Use dealer ID padded to 4 digits
  const dealerIdPadded = dealerId.toString().padStart(4, '0')
  
  // Combine: WA-[initials][randomLetters]-[dealerID]
  return `WA-${nameInitials}${randomLetters}-${dealerIdPadded}`
}

/**
 * Validate dealer code format
 */
export function validateDealerCodeFormat(code: string): boolean {
  // Format: WA-XXXX-YYYY (WA- followed by 4 letters, hyphen, 4 numbers)
  const dealerCodeRegex = /^WA-[A-Z]{4}-[0-9]{4}$/
  return dealerCodeRegex.test(code)
}

/**
 * Parse dealer ID from dealer code
 */
export function parseDealerIdFromCode(code: string): number | null {
  if (!validateDealerCodeFormat(code)) {
    return null
  }
  
  const parts = code.split('-')
  const dealerIdStr = parts[2]
  return parseInt(dealerIdStr, 10)
}

/**
 * Generate multiple dealer code suggestions
 */
export function generateDealerCodeSuggestions(dealerName: string, dealerId: number): string[] {
  const suggestions: string[] = []
  
  for (let i = 0; i < 3; i++) {
    suggestions.push(generateDealerCode(dealerName, dealerId + i))
  }
  
  return suggestions
}

/**
 * Check if dealer code is available (mock function - would check database in real implementation)
 */
export function isDealerCodeAvailable(code: string, existingCodes: string[]): boolean {
  return !existingCodes.includes(code)
}

/**
 * Get dealer info by code (mock data - would query database in real implementation)
 */
export function getDealerByCode(code: string): DealerCodeInfo | null {
  // Mock dealer data with Indian names
  const mockDealers: DealerCodeInfo[] = [
    {
      code: 'WA-RAKU-0002',
      dealerId: 2,
      dealerName: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      isActive: true,
      createdAt: '2024-01-15',
      customerCount: 15,
      totalRevenue: 85000
    },
    {
      code: 'WA-PRSH-0005',
      dealerId: 5,
      dealerName: 'Priya Sharma',
      email: 'priya@example.com',
      isActive: true,
      createdAt: '2024-02-01',
      customerCount: 8,
      totalRevenue: 45000
    }
  ]
  
  return mockDealers.find(dealer => dealer.code === code) || null
}

/**
 * Format dealer code for display
 */
export function formatDealerCode(code: string): string {
  if (!code) return ''
  
  // Add spaces for better readability: WA-XXXX-YYYY -> WA - XXXX - YYYY
  return code.replace(/-/g, ' - ')
}

/**
 * Generate dealer code from user input (removing spaces, converting to uppercase)
 */
export function normalizeDealerCode(input: string): string {
  return input.replace(/\s/g, '').toUpperCase()
}