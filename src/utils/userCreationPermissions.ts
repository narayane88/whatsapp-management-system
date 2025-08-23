/**
 * User Creation Permission System
 * Defines hierarchical permissions for user creation based on role levels
 */

export interface Role {
  id: number
  name: string
  level: number
  is_system: boolean
}

export interface UserRole {
  role: Role
  is_primary: boolean
}

/**
 * Determines what roles a user can assign when creating new users
 * Based on hierarchical permission system:
 * - OWNER (Level 1) → Can create: Level 1-6 users (ALL)
 * - ADMIN (Level 2) → Can create: Level 3-6 users (SUBDEALER, EMPLOYEE, CUSTOMER, custom roles)
 * - SUBDEALER (Level 3) → Can create: Level 5-6 users only (CUSTOMER and custom roles)
 * - EMPLOYEE (Level 4) → Can create: Level 5-6 users only (CUSTOMER and custom roles)
 * - CUSTOMER (Level 5+) → Cannot create users
 */
export function getCreatableRoles(currentUserRoles: UserRole[], allRoles: Role[]): Role[] {
  // Get the user's highest privilege level (lowest number = highest privilege)
  const highestPrivilegeLevel = Math.min(
    ...currentUserRoles.map(ur => ur.role.level)
  )

  // Define creation rules based on hierarchy
  const creationRules: Record<number, (roles: Role[]) => Role[]> = {
    // Level 1: OWNER can create Level 1-6 users (ALL)
    1: (roles) => roles.filter(role => role.level >= 1 && role.level <= 6),
    
    // Level 2: ADMIN can create Level 3-6 users
    2: (roles) => roles.filter(role => role.level >= 3 && role.level <= 6),
    
    // Level 3: SUBDEALER can create Level 5-6 users only
    3: (roles) => roles.filter(role => role.level >= 5 && role.level <= 6),
    
    // Level 4: EMPLOYEE can create Level 5-6 users only
    4: (roles) => roles.filter(role => role.level >= 5 && role.level <= 6),
    
    // Level 5+: CUSTOMER and below cannot create users
    5: () => []
  }

  // Apply creation rules based on user's privilege level
  const ruleKey = highestPrivilegeLevel <= 4 ? highestPrivilegeLevel : 5
  const applicableRule = creationRules[ruleKey] || creationRules[5]
  return applicableRule(allRoles)
}

/**
 * Checks if current user can create users at all
 */
export function canCreateUsers(currentUserRoles: UserRole[]): boolean {
  const highestPrivilegeLevel = Math.min(
    ...currentUserRoles.map(ur => ur.role.level)
  )
  
  // Users at level 5+ (customers) cannot create users
  return highestPrivilegeLevel <= 4
}

/**
 * Gets user creation restrictions message based on user role
 */
export function getUserCreationMessage(currentUserRoles: UserRole[]): string {
  const highestPrivilegeLevel = Math.min(
    ...currentUserRoles.map(ur => ur.role.level)
  )
  
  const primaryRole = currentUserRoles.find(ur => ur.is_primary)?.role.name || 'User'

  if (highestPrivilegeLevel === 1) {
    return `As ${primaryRole}, you can create all user types (Level 1-6).`
  } else if (highestPrivilegeLevel === 2) {
    return `As ${primaryRole}, you can create Level 3-6 users (Subdealers, Employees, Customers).`
  } else if (highestPrivilegeLevel === 3 || highestPrivilegeLevel === 4) {
    return `As ${primaryRole}, you can only create Level 5-6 users (Customers and custom roles).`
  } else {
    return `As ${primaryRole}, you do not have permission to create user accounts.`
  }
}

/**
 * Validates if a user can assign specific roles during user creation
 */
export function canAssignRoles(
  currentUserRoles: UserRole[], 
  rolesToAssign: number[], 
  allRoles: Role[]
): { canAssign: boolean; message?: string } {
  const creatableRoles = getCreatableRoles(currentUserRoles, allRoles)
  const creatableRoleIds = creatableRoles.map(r => r.id)
  
  const unauthorizedRoles = rolesToAssign.filter(roleId => 
    !creatableRoleIds.includes(roleId)
  )
  
  if (unauthorizedRoles.length > 0) {
    const unauthorizedRoleNames = allRoles
      .filter(r => unauthorizedRoles.includes(r.id))
      .map(r => r.name)
      .join(', ')
      
    return {
      canAssign: false,
      message: `You don't have permission to assign these roles: ${unauthorizedRoleNames}`
    }
  }
  
  return { canAssign: true }
}

/**
 * Gets filtered roles list based on user's creation permissions
 */
export function getFilteredRolesForCreation(
  currentUserRoles: UserRole[], 
  allRoles: Role[]
): Role[] {
  if (!canCreateUsers(currentUserRoles)) {
    return []
  }
  
  return getCreatableRoles(currentUserRoles, allRoles)
}