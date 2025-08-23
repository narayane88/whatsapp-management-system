# System Permissions Update

## 📋 Overview

This update provides comprehensive permissions aligned with your current WhatsApp Management System. The permissions are organized into 12 categories covering all aspects of your application.

## 🎯 Permission Categories

### 1. **User Management** (9 permissions)
- `users.create` - Create new users and accounts
- `users.read` - View users list and profile details  
- `users.update` - Edit user information and profiles
- `users.delete` - Delete user accounts
- `users.manage` - Full user account management
- `users.impersonate` - Login as another user
- `users.export` - Export user data
- `users.credit.manage` - Manage user credits and balances
- `users.avatar.upload` - Upload and manage user avatars

### 2. **Role & Permission Management** (13 permissions)
- Complete role and permission CRUD operations
- System role/permission management capabilities
- Permission template management
- Role assignment functionality

### 3. **WhatsApp Management** (17 permissions)
- Instance management (create, read, update, delete, manage)
- Message operations (send, read, manage)
- Account management (connect, view, edit, disconnect)
- Server management (add, configure, monitor, remove)

### 4. **Customer Management** (11 permissions)
- Customer lifecycle management
- Dealer account management
- Export capabilities
- Impersonation for support

### 5. **Package Management** (10 permissions)
- Subscription package CRUD operations
- User subscription management
- Package assignment and billing

### 6. **Financial Management** (16 permissions)
- Transaction management
- BizPoints system control
- Payout processing
- Financial reporting and analytics
- Commission management

### 7. **Voucher Management** (7 permissions)
- Voucher lifecycle management
- Redemption and validation
- Customer voucher operations

### 8. **System Administration** (9 permissions)
- System settings and configuration
- Log management and monitoring
- Health status monitoring
- Backup and maintenance operations

### 9. **Security Management** (10 permissions)
- Security policy configuration
- Event log monitoring
- Session management
- IP restrictions and audit trails

### 10. **API & Documentation** (8 permissions)
- API documentation management
- API key lifecycle
- Usage monitoring and rate limiting

### 11. **Company Profile & Branding** (7 permissions)
- Company profile management
- Theme and branding control
- Language settings

### 12. **Dashboard & Analytics** (8 permissions)
- Dashboard access control
- Analytics and reporting
- Performance metrics

## 👥 Role Assignment Summary

### **OWNER (Level 1)** - 108 permissions
- **Full System Access** - All permissions granted
- Complete administrative control
- System-critical operations

### **ADMIN (Level 2)** - 101 permissions  
- **Almost Full Access** - Excludes critical functions:
  - User impersonation
  - Customer impersonation  
  - System backup restoration
  - System permission/role management
  - Session termination
  - System maintenance

### **SUBDEALER (Level 3)** - 41 permissions
- **Customer & WhatsApp Focus**:
  - User and customer management
  - WhatsApp instance operations
  - Package and subscription handling
  - Limited financial access
  - Voucher management
  - Analytics dashboard

### **EMPLOYEE (Level 4)** - 17 permissions
- **Operational Access**:
  - View-only user/customer access
  - Basic WhatsApp operations
  - Message sending capabilities
  - Limited dashboard access

### **CUSTOMER (Level 5)** - 8 permissions
- **Self-Service Only**:
  - Own WhatsApp instances
  - Message operations
  - Package information
  - Voucher redemption
  - Own transaction history

## 🚀 Migration Process

### Step 1: Backup Current State
```bash
# The migration automatically creates backups
node scripts/migrate-system-permissions.js
```

### Step 2: Run Migration
The migration script will:
1. **Backup existing permissions** - Creates timestamped backup table
2. **Clear old system permissions** - Removes outdated permissions
3. **Install new permissions** - Adds 108 comprehensive permissions
4. **Assign role permissions** - Configures appropriate access levels
5. **Create indexes** - Optimizes database performance
6. **Log audit trail** - Records migration event

### Step 3: Validation
```bash
# Validate permission structure only
node scripts/migrate-system-permissions.js --validate-only
```

## 📊 Key Improvements

### **Granular Control**
- Separate permissions for each CRUD operation
- Resource-specific access control
- Action-based permission model

### **Security Enhancement**
- Clear separation between system and custom permissions
- Role-based access control with priority levels
- Comprehensive audit capabilities

### **Feature Coverage**
- All current application features covered
- Future-ready permission structure
- Scalable category organization

### **Role Optimization**
- Logical permission distribution
- Hierarchy-based access control
- Operational efficiency focus

## 🔧 Usage Examples

### Check User Permission
```typescript
import { hasPermission } from '@/lib/permissions'

// Check specific permission
const canManageUsers = await hasPermission(userEmail, 'users.manage')
const canSendMessages = await hasPermission(userEmail, 'whatsapp.messages.send')
```

### Role-Based UI
```typescript
import { usePermissions } from '@/hooks/usePermissions'

const { hasPermission } = usePermissions()

// Conditional rendering
{hasPermission('finance.transactions.read') && (
  <TransactionHistory />
)}
```

### API Route Protection
```typescript
import { checkCurrentUserPermission } from '@/lib/permissions'

// Protect API endpoints
if (!(await checkCurrentUserPermission('users.create'))) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
}
```

## 📈 Performance Optimizations

- **Database indexes** on frequently queried columns
- **Efficient permission checking** with optimized queries
- **Role hierarchy caching** for faster access control
- **Batch permission operations** for bulk updates

## 🔒 Security Features

- **System permission protection** - Cannot be modified accidentally
- **Role hierarchy enforcement** - Higher levels manage lower levels
- **Audit trail logging** - All permission changes tracked
- **Session-based caching** - Improved performance with security

## 🎯 Migration Benefits

1. **Complete Feature Coverage** - Every app feature has appropriate permissions
2. **Scalable Structure** - Easy to add new permissions as features grow
3. **Security Compliance** - Enterprise-grade access control
4. **Operational Efficiency** - Logical role-permission assignments
5. **Future-Ready** - Flexible foundation for new features

## ⚠️ Important Notes

- **Backup Recommended** - Migration creates automatic backups
- **Test Environment First** - Verify in staging before production
- **Role Review** - Check role assignments match your requirements
- **Permission Audit** - Review user access after migration
- **Documentation Update** - Update any hardcoded permission references

Run the migration when ready to upgrade your permission system to the comprehensive structure!