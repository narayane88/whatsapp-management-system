const fs = require('fs');
const path = require('path');

/**
 * API Documentation Generator
 * Automatically scans all API routes and generates comprehensive documentation
 */

const API_BASE_PATH = path.join(__dirname, '../src/app/api');
const DOCS_OUTPUT_PATH = path.join(__dirname, '../docs/api-documentation.md');

// API route information extracted from files
const apiRoutes = [];

/**
 * Extract route information from a route file
 */
function extractRouteInfo(filePath, relativePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const route = {
      path: relativePath.replace('/route.ts', '').replace(/\\/g, '/'),
      file: relativePath,
      methods: [],
      description: '',
      parameters: [],
      responses: [],
      authentication: false,
      permissions: []
    };

    // Extract HTTP methods
    const methodMatches = content.match(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g);
    if (methodMatches) {
      route.methods = methodMatches.map(match => match.match(/(GET|POST|PUT|DELETE|PATCH)/)[1]);
    }

    // Extract description from comments
    const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n/);
    if (descriptionMatch) {
      route.description = descriptionMatch[1].trim();
    }

    // Extract authentication requirements
    if (content.includes('getServerSession') || content.includes('checkCurrentUserPermission')) {
      route.authentication = true;
    }

    // Extract required permissions
    const permissionMatches = content.match(/checkCurrentUserPermission\(['"`]([^'"`]+)['"`]\)/g);
    if (permissionMatches) {
      route.permissions = permissionMatches.map(match => 
        match.match(/['"`]([^'"`]+)['"`]/)[1]
      );
    }

    // Extract request parameters from destructuring
    const paramMatches = content.match(/const\s*{\s*([^}]+)\s*}\s*=\s*body/g);
    if (paramMatches) {
      route.parameters = paramMatches[0]
        .replace(/const\s*{\s*/, '')
        .replace(/\s*}\s*=\s*body.*/, '')
        .split(',')
        .map(param => param.trim().replace(/=.*$/, '').trim())
        .filter(param => param && !param.includes('//'));
    }

    // Extract response codes
    const responseMatches = content.match(/status:\s*(\d+)/g);
    if (responseMatches) {
      route.responses = [...new Set(responseMatches.map(match => 
        parseInt(match.match(/\d+/)[0])
      ))];
    }

    return route;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Recursively scan directory for route files
 */
function scanDirectory(dirPath, basePath = '') {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath, relativePath);
      } else if (entry.name === 'route.ts') {
        const routeInfo = extractRouteInfo(fullPath, relativePath);
        if (routeInfo) {
          apiRoutes.push(routeInfo);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
}

/**
 * Generate markdown documentation
 */
function generateMarkdownDocs() {
  let markdown = `# WhatsApp System API Documentation

*Generated on: ${new Date().toISOString()}*

This documentation is automatically generated from the API route files.

## Table of Contents

`;

  // Generate table of contents
  const categories = {};
  apiRoutes.forEach(route => {
    const category = route.path.split('/')[1] || 'root';
    if (!categories[category]) categories[category] = [];
    categories[category].push(route);
  });

  for (const category in categories) {
    markdown += `- [${category.toUpperCase()}](#${category.toLowerCase()})\n`;
  }

  markdown += '\n---\n\n';

  // Generate documentation for each category
  for (const [category, routes] of Object.entries(categories)) {
    markdown += `## ${category.toUpperCase()}\n\n`;
    
    routes.sort((a, b) => a.path.localeCompare(b.path));
    
    for (const route of routes) {
      markdown += `### ${route.methods.join(', ')} \`${route.path}\`\n\n`;
      
      if (route.description) {
        markdown += `**Description:** ${route.description}\n\n`;
      }
      
      markdown += `**Methods:** ${route.methods.join(', ')}\n\n`;
      
      if (route.authentication) {
        markdown += `**Authentication:** Required 🔒\n\n`;
      }
      
      if (route.permissions.length > 0) {
        markdown += `**Required Permissions:**\n`;
        route.permissions.forEach(perm => {
          markdown += `- \`${perm}\`\n`;
        });
        markdown += '\n';
      }
      
      if (route.parameters.length > 0) {
        markdown += `**Parameters:**\n`;
        route.parameters.forEach(param => {
          markdown += `- \`${param}\`\n`;
        });
        markdown += '\n';
      }
      
      if (route.responses.length > 0) {
        markdown += `**Response Codes:** ${route.responses.sort().join(', ')}\n\n`;
      }
      
      markdown += `**File:** \`${route.file}\`\n\n`;
      markdown += '---\n\n';
    }
  }

  // Add API usage examples
  markdown += `## API Usage Examples

### Authentication
Most API endpoints require authentication via NextAuth session:

\`\`\`javascript
// Include session in your requests
const session = await getServerSession(authOptions)
\`\`\`

### Error Handling
All endpoints return standard HTTP status codes:

- \`200\` - Success
- \`201\` - Created
- \`400\` - Bad Request
- \`401\` - Unauthorized
- \`403\` - Forbidden
- \`404\` - Not Found
- \`409\` - Conflict
- \`500\` - Internal Server Error

### Response Format
All responses follow this general structure:

\`\`\`json
{
  "data": { ... },
  "message": "Success message",
  "error": "Error message (if any)",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
\`\`\`

## Contributing

When adding new API routes, please ensure:

1. **Documentation Comments**: Add JSDoc comments at the top of your route handlers
2. **Error Handling**: Implement proper error responses
3. **Authentication**: Add authentication checks where needed
4. **Permissions**: Implement permission checks using \`checkCurrentUserPermission\`
5. **Validation**: Validate input parameters
6. **Run Documentation Update**: Execute \`npm run docs:generate\` after adding new routes

---

*This documentation is automatically generated. Do not edit manually.*
`;

  return markdown;
}

/**
 * Main execution
 */
function main() {
  console.log('🔄 Scanning API routes...');
  
  // Scan all API routes
  scanDirectory(API_BASE_PATH);
  
  console.log(`✅ Found ${apiRoutes.length} API routes`);
  
  // Generate documentation
  const markdown = generateMarkdownDocs();
  
  // Ensure docs directory exists
  const docsDir = path.dirname(DOCS_OUTPUT_PATH);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Write documentation
  fs.writeFileSync(DOCS_OUTPUT_PATH, markdown);
  
  console.log(`✅ API documentation generated at: ${DOCS_OUTPUT_PATH}`);
  console.log(`📊 Total routes documented: ${apiRoutes.length}`);
  
  // Show summary
  const categories = {};
  apiRoutes.forEach(route => {
    const category = route.path.split('/')[1] || 'root';
    categories[category] = (categories[category] || 0) + 1;
  });
  
  console.log('\n📋 Routes by category:');
  for (const [category, count] of Object.entries(categories)) {
    console.log(`   ${category}: ${count} routes`);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, apiRoutes };