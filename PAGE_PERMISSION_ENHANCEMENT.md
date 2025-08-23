# Page & Menu Permission Enhancement

## 🎯 Problem Solved

Previously, all users could see all admin menu items and access all pages regardless of their role. Now the system properly restricts:

- ✅ **Menu Visibility** - Users only see menu items they have access to
- ✅ **Page Access** - Unauthorized pages are blocked with informative error messages  
- ✅ **Role-Based Navigation** - Navigation adapts based on user permissions
- ✅ **Enhanced Security** - Both frontend and middleware protection

## 🔐 New Permission Categories

### **Page Access Permissions** (11 permissions)
Controls which admin pages users can visit:

```
dashboard.admin.access          - Access admin dashboard page
customers.page.access           - Access customers management page  
packages.page.access            - Access packages management page
vouchers.page.access            - Access vouchers management page
transactions.page.access        - Access transactions page
subscriptions.page.access       - Access subscriptions management page
bizpoints.page.access           - Access BizCoins management page
users.page.access              - Access users management page
servers.page.access             - Access WhatsApp servers page
api.docs.page.access           - Access API documentation page
settings.page.access            - Access system settings page
```

### **Menu Visibility Permissions** (12 permissions)
Controls which menu items appear in the navigation:

```
menu.dashboard.view             - Show dashboard in navigation menu
menu.customers.view             - Show customers in navigation menu
menu.packages.view              - Show packages in navigation menu
menu.vouchers.view              - Show vouchers in navigation menu
menu.transactions.view          - Show transactions in navigation menu
menu.subscriptions.view         - Show subscriptions in navigation menu
menu.bizpoints.view             - Show BizCoins in navigation menu
menu.users.view                 - Show users in navigation menu
menu.servers.view               - Show servers in navigation menu
menu.api_docs.view              - Show API docs in navigation menu
menu.languages.view             - Show languages in navigation menu
menu.settings.view              - Show settings in navigation menu
```

### **Action Button Permissions** (66 permissions) 🆕
Fine-grained control over action buttons on each page:

#### Customer Management (8 buttons)
```
customers.create.button         - Show create customer button
customers.edit.button           - Show edit customer button  
customers.delete.button         - Show delete customer button
customers.view.button           - Show view customer details button
customers.suspend.button        - Show suspend customer button
customers.activate.button       - Show activate customer button
customers.export.button         - Show export customers button
customers.import.button         - Show import customers button
```

#### Package Management (7 buttons)
```
packages.create.button          - Show create package button
packages.edit.button            - Show edit package button
packages.delete.button          - Show delete package button
packages.duplicate.button       - Show duplicate package button
packages.activate.button        - Show activate package button
packages.deactivate.button      - Show deactivate package button
packages.pricing.button         - Show manage pricing button
```

#### Transaction Management (7 buttons)
```
transactions.view.button        - Show view transaction details button
transactions.approve.button     - Show approve transaction button
transactions.reject.button      - Show reject transaction button
transactions.refund.button      - Show refund transaction button
transactions.export.button      - Show export transactions button
transactions.filter.button      - Show advanced filter button
transactions.bulk.button        - Show bulk operations button
```

#### And 44 more action buttons across all modules...

### **Enhanced Feature Permissions** (48 permissions)
Specific business operations and advanced features:

```
subscriptions.assign            - Assign subscriptions to users
subscriptions.cancel            - Cancel user subscriptions
subscriptions.renew             - Renew user subscriptions
subscriptions.pricing.manage    - Manage subscription pricing
bizpoints.transfer              - Transfer BizCoins between accounts
bizpoints.withdraw              - Process BizCoins withdrawals
bizpoints.history.view          - View BizCoins transaction history
bizpoints.rates.manage          - Manage BizCoins exchange rates
transactions.approve            - Approve pending transactions
transactions.reject             - Reject pending transactions
transactions.refund             - Process transaction refunds
transactions.bulk.process       - Process bulk transactions
...and 36 more feature permissions
```

## 👥 Updated Role Assignments

### **OWNER (Level 1)** - Full Access
- ✅ All 11 admin pages accessible
- ✅ All 12 menu items visible  
- ✅ All 66 action buttons available
- ✅ All 48 enhanced features
- **Total**: 152 permissions - Complete system control

### **ADMIN (Level 2)** - Most Features
- ✅ 11 admin pages (full page access)
- ✅ 12 menu items visible
- ✅ 61 action buttons (excludes critical delete/reset operations)
- ✅ 42 enhanced features
- **Total**: 136 permissions
- **Excluded**: Delete users, reset settings, server deletion buttons

### **SUBDEALER (Level 3)** - Business Focused
- ✅ 7 admin pages (customer & business focused)
- ✅ 8 menu items visible
- ✅ 26 action buttons (selective operational buttons)
- ✅ 21 enhanced features (customer management focused)
- **Total**: 62 permissions
- **Focus**: Customer operations, package management, subscriptions, BizCoins transfers

### **EMPLOYEE (Level 4)** - Basic Operations
- ✅ 4 admin pages (read-mostly operations)
- ✅ 5 menu items visible  
- ✅ 8 action buttons (mainly view/export operations)
- ✅ 9 enhanced features (basic operations only)
- **Total**: 26 permissions
- **Focus**: View data, basic package operations, transaction monitoring

### **CUSTOMER (Level 5)** - Self-Service Only
- ✅ 2 admin pages (minimal self-service)
- ✅ 3 menu items visible
- ✅ 2 action buttons (view own data only)
- ✅ 5 enhanced features (self-service operations)
- **Total**: 12 permissions
- **Focus**: View own transactions and packages only

## 🛠️ Technical Implementation

### 1. **Permission-Aware Navigation Component**
`src/components/layout/PermissionAwareNavigation.tsx`

- Dynamically shows/hides menu items based on permissions
- Loading states while checking permissions
- Graceful fallback for users with no access

### 2. **Page Permission Guard Component**  
`src/components/auth/PagePermissionGuard.tsx`

- Protects individual pages with permission checks
- Shows informative access denied messages
- Provides navigation options when access is denied

### 3. **Action Button Components** 🆕
`src/components/auth/ActionButton.tsx`

- Permission-aware Button and ActionIcon components
- Conditional rendering based on action button permissions
- Pre-configured common action buttons (Create, Edit, Delete, View)
- Permission wrapper for complex UI sections

### 4. **Action Permission Hooks** 🆕  
`src/hooks/useActionPermissions.ts`

- `useActionPermissions()` - Complete permission management
- `useActionButtonPermission(permission)` - Single button permission check
- `usePermissionGroup(group)` - Check groups of related permissions
- Pre-defined permission groups for common operations

### 5. **Middleware Protection**
`src/middleware/pagePermissions.ts`

- Server-side route protection
- Prevents unauthorized API access
- Logs security events for audit trail

### 6. **Updated Admin Layout**
`src/components/layout/AdminLayout.tsx`

- Integrates permission-aware navigation
- Maintains responsive design
- Preserves existing functionality

## 📊 Permission Matrix

| Page/Menu Item | OWNER | ADMIN | SUBDEALER | EMPLOYEE | CUSTOMER |
|----------------|-------|-------|-----------|----------|----------|
| Dashboard      | ✅    | ✅    | ✅        | ✅       | ✅       |
| Customers      | ✅    | ✅    | ✅        | ✅       | ❌       |
| Packages       | ✅    | ✅    | ✅        | ✅       | ✅       |
| Vouchers       | ✅    | ✅    | ✅        | ❌       | ❌       |
| Transactions   | ✅    | ✅    | ✅        | ✅       | ✅       |
| Subscriptions  | ✅    | ✅    | ✅        | ❌       | ❌       |
| BizCoins       | ✅    | ✅    | ✅        | ❌       | ❌       |
| Users          | ✅    | ✅    | ❌        | ❌       | ❌       |
| Servers        | ✅    | ✅    | ✅        | ✅       | ❌       |
| API Docs       | ✅    | ✅    | ❌        | ❌       | ❌       |
| Languages      | ✅    | ✅    | ❌        | ❌       | ❌       |
| Settings       | ✅    | ⚠️*   | ❌        | ❌       | ❌       |

*ADMIN has settings access but not security tab

## 🚀 Migration Process

### Step 1: Run Page Permission Migration
```bash
# Add page and menu permissions
node scripts/migrate-page-permissions.js

# Validate only (no changes)
node scripts/migrate-page-permissions.js --validate-only
```

### Step 2: Verify User Experience
1. **Login as different roles** to test menu visibility
2. **Try accessing restricted pages** to see error messages  
3. **Check permission guards** work correctly
4. **Verify navigation** adapts per role

### Step 3: Monitor Security Events
```sql
-- Check access denied attempts
SELECT * FROM security_events 
WHERE event_type = 'unauthorized_page_access' 
ORDER BY created_at DESC;
```

## 📈 Security Improvements

### **Frontend Protection**
- Permission-aware navigation component
- Page-level permission guards
- Graceful error handling
- User-friendly access denied messages

### **Backend Protection**  
- Middleware route protection
- Database permission validation
- Security event logging
- API endpoint permissions

### **Audit Trail**
- All access attempts logged
- Failed access attempts tracked
- Permission changes recorded
- Role-based activity monitoring

## 🎯 User Experience Enhancements

### **Dynamic Navigation**
- Menus adapt to user permissions
- Loading states during permission checks
- Clean interface for limited access users
- No broken or empty menu items

### **Clear Error Messages**
- Informative access denied pages
- Shows required permissions
- Provides navigation alternatives
- Explains how to get access

### **Responsive Design**
- Maintained mobile responsiveness
- Consistent styling with existing theme
- Proper loading states
- Graceful degradation

## 🔧 Configuration Options

### **Route Permission Mapping**
Update `src/middleware/pagePermissions.ts`:

```typescript
const routePermissions: Record<string, string[]> = {
  '/admin/new-page': ['new.page.access'],
  // Add new routes and their required permissions
}
```

### **Menu Items**  
Update `src/components/layout/PermissionAwareNavigation.tsx`:

```typescript
const navigationItems: NavigationItem[] = [
  {
    name: 'New Page',
    href: '/admin/new-page', 
    icon: FiNewIcon,
    requiredPermissions: ['new.page.access', 'menu.new.view']
  }
]
```

## ✅ Testing Checklist

- [ ] OWNER can access all pages and see all menu items
- [ ] ADMIN cannot access security settings tab  
- [ ] SUBDEALER cannot see users or API docs menu
- [ ] EMPLOYEE has limited read-only access
- [ ] CUSTOMER only sees self-service items
- [ ] Access denied pages show proper error messages
- [ ] Navigation loads without errors
- [ ] Middleware blocks unauthorized routes
- [ ] Security events are logged properly
- [ ] Page guards work on direct URL access

## 📱 Mobile Considerations

- Navigation collapses properly on mobile
- Permission checks work on touch devices
- Loading states are mobile-friendly
- Error messages fit mobile screens
- Menu toggle works with permission filtering

## 💻 Usage Examples

### Basic Action Button Usage
```tsx
import { ActionButton, CommonActionButtons } from '@/components/auth/ActionButton'

function CustomerManagement() {
  return (
    <div>
      {/* Simple action button */}
      <ActionButton permission="customers.create.button" onClick={handleCreate}>
        Create Customer
      </ActionButton>

      {/* Pre-configured action buttons */}
      <CommonActionButtons.Edit 
        permission="customers.edit.button" 
        onClick={handleEdit} 
      />
      <CommonActionButtons.Delete 
        permission="customers.delete.button" 
        onClick={handleDelete} 
      />
    </div>
  )
}
```

### Permission Groups Usage
```tsx
import { usePermissionGroup, PERMISSION_GROUPS } from '@/hooks/useActionPermissions'

function TransactionPage() {
  const { hasAnyPermission, hasAllPermissions } = usePermissionGroup('TRANSACTION_MANAGEMENT')
  
  return (
    <div>
      {hasAnyPermission && (
        <div>User can perform some transaction operations</div>
      )}
      {hasAllPermissions && (
        <div>User has full transaction management access</div>
      )}
    </div>
  )
}
```

### Permission Wrapper Usage
```tsx
import { PermissionWrapper } from '@/components/auth/ActionButton'

function AdminPanel() {
  return (
    <div>
      <PermissionWrapper permission="users.create.button">
        <CreateUserForm />
      </PermissionWrapper>
      
      <PermissionWrapper 
        permission={['users.edit.button', 'users.delete.button']} 
        requireAll={false}
        fallback={<div>No user management permissions</div>}
      >
        <UserManagementTools />
      </PermissionWrapper>
    </div>
  )
}
```

## 🎉 Benefits

1. **Enhanced Security** - Proper access control at multiple layers
2. **Better UX** - Users only see what they can use  
3. **Fine-Grained Control** - Action button-level permissions
4. **Audit Compliance** - All access attempts logged
5. **Scalable Permissions** - Easy to add new pages/features
6. **Role Clarity** - Clear separation of role capabilities
7. **Developer Friendly** - Simple permission checking APIs
8. **Performance Optimized** - Indexed permission lookups

The permission system now provides complete control over:
- ✅ **Page Access** - Who can visit which pages
- ✅ **Menu Visibility** - What navigation items users see
- ✅ **Action Buttons** - Which buttons appear for each user
- ✅ **Feature Operations** - What actions users can perform

Run the migration to activate these enhancements and provide your users with a secure, role-appropriate admin experience!