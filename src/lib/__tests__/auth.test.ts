import { 
  hasPermission, 
  canManageUsers, 
  canManagePackages, 
  canProcessPayouts,
  isOwner,
  isSubDealer,
  isEmployee,
  isCustomer
} from '../auth'

describe('Auth Utilities', () => {
  describe('hasPermission', () => {
    test('should return true for exact role matches', () => {
      expect(hasPermission('OWNER', ['OWNER'])).toBe(true)
      expect(hasPermission('SUBDEALER', ['SUBDEALER'])).toBe(true)
      expect(hasPermission('EMPLOYEE', ['EMPLOYEE'])).toBe(true)
      expect(hasPermission('CUSTOMER', ['CUSTOMER'])).toBe(true)
    })

    test('should return false for non-matching roles', () => {
      expect(hasPermission('OWNER', ['SUBDEALER'])).toBe(false)
      expect(hasPermission('SUBDEALER', ['EMPLOYEE'])).toBe(false)
      expect(hasPermission('EMPLOYEE', ['CUSTOMER'])).toBe(false)
      expect(hasPermission('CUSTOMER', ['OWNER'])).toBe(false)
    })

    test('should return true for roles in allowed array', () => {
      expect(hasPermission('OWNER', ['OWNER', 'SUBDEALER'])).toBe(true)
      expect(hasPermission('SUBDEALER', ['OWNER', 'SUBDEALER'])).toBe(true)
      expect(hasPermission('EMPLOYEE', ['EMPLOYEE', 'CUSTOMER'])).toBe(true)
    })

    test('should return true for customer only with customer permissions', () => {
      expect(hasPermission('CUSTOMER', ['CUSTOMER'])).toBe(true)
      expect(hasPermission('CUSTOMER', ['OWNER'])).toBe(false)
      expect(hasPermission('CUSTOMER', ['SUBDEALER'])).toBe(false)
      expect(hasPermission('CUSTOMER', ['EMPLOYEE'])).toBe(false)
    })

    test('should handle multiple allowed roles', () => {
      expect(hasPermission('SUBDEALER', ['OWNER', 'SUBDEALER'])).toBe(true)
      expect(hasPermission('EMPLOYEE', ['SUBDEALER', 'EMPLOYEE'])).toBe(true)
      expect(hasPermission('CUSTOMER', ['OWNER', 'SUBDEALER', 'EMPLOYEE'])).toBe(false)
    })

    test('should return false for invalid roles', () => {
      expect(hasPermission('INVALID_ROLE', ['OWNER'])).toBe(false)
      expect(hasPermission('', ['OWNER'])).toBe(false)
      expect(hasPermission(null as unknown as string, ['OWNER'])).toBe(false)
    })
  })

  describe('Role-specific permission functions', () => {
    test('canManageUsers should allow OWNER and SUBDEALER', () => {
      expect(canManageUsers('OWNER')).toBe(true)
      expect(canManageUsers('SUBDEALER')).toBe(true)
      expect(canManageUsers('EMPLOYEE')).toBe(false)
      expect(canManageUsers('CUSTOMER')).toBe(false)
    })

    test('canManagePackages should allow only OWNER', () => {
      expect(canManagePackages('OWNER')).toBe(true)
      expect(canManagePackages('SUBDEALER')).toBe(false)
      expect(canManagePackages('EMPLOYEE')).toBe(false)
      expect(canManagePackages('CUSTOMER')).toBe(false)
    })

    test('canProcessPayouts should allow only OWNER', () => {
      expect(canProcessPayouts('OWNER')).toBe(true)
      expect(canProcessPayouts('SUBDEALER')).toBe(false)
      expect(canProcessPayouts('EMPLOYEE')).toBe(false)
      expect(canProcessPayouts('CUSTOMER')).toBe(false)
    })
  })

  describe('Role check functions', () => {
    test('isOwner should correctly identify owner role', () => {
      expect(isOwner('OWNER')).toBe(true)
      expect(isOwner('SUBDEALER')).toBe(false)
      expect(isOwner('EMPLOYEE')).toBe(false)
      expect(isOwner('CUSTOMER')).toBe(false)
    })

    test('isSubDealer should correctly identify subdealer role', () => {
      expect(isSubDealer('OWNER')).toBe(false)
      expect(isSubDealer('SUBDEALER')).toBe(true)
      expect(isSubDealer('EMPLOYEE')).toBe(false)
      expect(isSubDealer('CUSTOMER')).toBe(false)
    })

    test('isEmployee should correctly identify employee role', () => {
      expect(isEmployee('OWNER')).toBe(false)
      expect(isEmployee('SUBDEALER')).toBe(false)
      expect(isEmployee('EMPLOYEE')).toBe(true)
      expect(isEmployee('CUSTOMER')).toBe(false)
    })

    test('isCustomer should correctly identify customer role', () => {
      expect(isCustomer('OWNER')).toBe(false)
      expect(isCustomer('SUBDEALER')).toBe(false)
      expect(isCustomer('EMPLOYEE')).toBe(false)
      expect(isCustomer('CUSTOMER')).toBe(true)
    })
  })

  describe('Edge cases and error handling', () => {
    test('should handle undefined and null values gracefully', () => {
      expect(hasPermission(undefined as unknown as string, ['OWNER'])).toBe(false)
      expect(hasPermission(null as unknown as string, ['OWNER'])).toBe(false)
      expect(hasPermission('OWNER', undefined as unknown as string[])).toBe(false)
      expect(hasPermission('OWNER', null as unknown as string[])).toBe(false)
    })

    test('should handle empty arrays', () => {
      expect(hasPermission('OWNER', [])).toBe(false)
      expect(hasPermission('CUSTOMER', [])).toBe(false)
    })

    test('should be case sensitive', () => {
      expect(hasPermission('owner', ['OWNER'])).toBe(false)
      expect(hasPermission('Owner', ['OWNER'])).toBe(false)
      expect(hasPermission('OWNER', ['owner'])).toBe(false)
    })
  })
})