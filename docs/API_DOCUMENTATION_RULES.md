# API Documentation Rules & Guidelines

## 🎯 Purpose

This document establishes mandatory rules and processes for maintaining API documentation in the WhatsApp System project. All developers must follow these guidelines to ensure comprehensive, up-to-date documentation.

## 📋 Rules for API Development

### 1. **MANDATORY: JSDoc Comments**

Every API route handler MUST include JSDoc comments with proper documentation:

```typescript
/**
 * GET /api/users - Retrieve all users with optional filtering
 * 
 * @description Fetches users with role-based filtering and pagination
 * @authentication Required - Session-based authentication
 * @permissions users.read
 * @param {string} [is_active] - Filter by active status
 * @param {number} [level] - Filter by role level
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=50] - Items per page
 * @returns {Object} Users list with pagination info
 * @throws {401} Unauthorized - Invalid session
 * @throws {403} Forbidden - Insufficient permissions
 * @throws {500} Internal Server Error
 */
export async function GET(request: NextRequest) {
  // Implementation...
}
```

### 2. **MANDATORY: Error Handling Documentation**

Document all possible error responses:

```typescript
// ❌ BAD - No error documentation
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
}

// ✅ GOOD - Documented error responses
/**
 * @throws {400} Bad Request - Missing required fields
 * @throws {409} Conflict - Email already exists
 * @throws {500} Internal Server Error
 */
export async function POST(request: NextRequest) {
  if (!email) {
    return NextResponse.json({ 
      error: 'Missing required fields: email' 
    }, { status: 400 })
  }
}
```

### 3. **MANDATORY: Parameter Documentation**

Document all request parameters and body fields:

```typescript
/**
 * @param {Object} request.body
 * @param {string} request.body.name - User's full name
 * @param {string} request.body.email - User's email address
 * @param {string} request.body.password - User's password (min 8 chars)
 * @param {number[]} request.body.roles - Array of role IDs to assign
 * @param {number} [request.body.commissionRate=0] - Commission percentage for Level 3 users
 */
```

### 4. **MANDATORY: Authentication & Permission Documentation**

Clearly specify authentication and permission requirements:

```typescript
/**
 * @authentication Required - NextAuth session
 * @permissions users.create, users.assign_roles
 * @role_restrictions Can only create users with lower role levels
 */
```

## 🔄 Automatic Documentation Process

### **Git Pre-Commit Hook**

The system automatically:

1. **Detects API Changes**: Monitors `src/app/api/**/route.ts` files
2. **Regenerates Documentation**: Runs `npm run docs:generate`
3. **Updates Git Commit**: Adds updated documentation to the commit

### **Manual Documentation Commands**

```bash
# Generate API documentation
npm run docs:generate

# Watch for changes and auto-regenerate
npm run docs:watch

# Serve documentation locally
npm run docs:serve

# Setup Git hooks (run once)
npm run hooks:setup
```

## 📝 Developer Workflow

### **When Creating New API Routes**

1. **Create Route File**: `src/app/api/[endpoint]/route.ts`
2. **Add JSDoc Comments**: Follow the mandatory format above
3. **Implement Error Handling**: Document all error scenarios
4. **Test Locally**: Run `npm run docs:generate` to verify
5. **Commit Changes**: Pre-commit hook will auto-update docs

### **When Modifying Existing Routes**

1. **Update JSDoc Comments**: Reflect any changes in parameters/responses
2. **Update Error Handling**: Document new error scenarios
3. **Test Documentation**: Run `npm run docs:generate`
4. **Commit**: Documentation updates automatically

## 🚫 What NOT to Do

### **❌ Don't Skip Documentation**
```typescript
// BAD - No documentation
export async function GET(request: NextRequest) {
  const users = await getUsers()
  return NextResponse.json({ users })
}
```

### **❌ Don't Use Generic Comments**
```typescript
// BAD - Generic, unhelpful comment
/**
 * Gets stuff
 */
export async function GET(request: NextRequest) {
```

### **❌ Don't Forget Error Cases**
```typescript
// BAD - Only documents success case
/**
 * Creates a new user
 * @returns {Object} Created user
 */
export async function POST(request: NextRequest) {
```

## ✅ Best Practices

### **✅ Use Descriptive Titles**
```typescript
/**
 * POST /api/admin/users - Create new user with role assignment and validation
 */
```

### **✅ Document Business Logic**
```typescript
/**
 * @description Creates user with automatic dealer code generation for Level 3+ users
 * @business_rules 
 * - Level 3 users automatically get commission tracking
 * - Dealer codes are unique and auto-generated
 * - Parent-child relationships established for Level 5+ users
 */
```

### **✅ Include Examples**
```typescript
/**
 * @example
 * POST /api/users
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "roles": [3],
 *   "commissionRate": 5.5
 * }
 */
```

## 🔧 System Integration

### **File Structure**
```
docs/
├── api-documentation.md          # Auto-generated API docs
├── API_DOCUMENTATION_RULES.md    # This file
└── [endpoint]-examples.md         # Manual examples (optional)

scripts/
├── generate-api-docs.js          # Documentation generator
└── setup-hooks.js                # Git hooks installer

.githooks/
└── pre-commit                     # Auto-documentation hook
```

### **Generated Documentation Includes**

- **Route List**: All API endpoints with methods
- **Authentication Requirements**: Session and permission needs
- **Parameter Documentation**: Request body and query parameters
- **Response Codes**: All possible HTTP status codes
- **Error Scenarios**: Documented error cases
- **File Locations**: Links to source files

## 🚨 Enforcement

### **Automatic Checks**

The pre-commit hook will:
- ✅ Always regenerate documentation
- ✅ Include updated docs in commits
- ❌ **NOT** block commits for missing documentation (warning only)

### **Manual Review Process**

During code reviews, check:
- [ ] JSDoc comments present and complete
- [ ] Error scenarios documented
- [ ] Authentication/permissions specified
- [ ] Parameter types and descriptions provided

## 📊 Monitoring

### **Documentation Coverage**

Run `npm run docs:generate` to see:
- Total API routes found
- Routes by category
- Documentation completeness

### **Quality Metrics**

Monitor for:
- Routes with missing JSDoc comments
- Routes without error documentation
- Routes without parameter documentation

## 🎯 Goals

1. **100% API Route Coverage**: Every route documented
2. **Comprehensive Error Documentation**: All error scenarios covered
3. **Automatic Updates**: Documentation always current with code
4. **Developer Friendly**: Easy to understand and maintain

---

## ⚡ Quick Start for New Developers

1. **Clone Repository**
2. **Run**: `npm install` (automatically sets up hooks)
3. **Create API Route**: Follow JSDoc format above
4. **Commit**: Documentation updates automatically
5. **View Docs**: `npm run docs:serve`

---

*Last Updated: ${new Date().toISOString()}*
*This document is part of the mandatory development workflow.*