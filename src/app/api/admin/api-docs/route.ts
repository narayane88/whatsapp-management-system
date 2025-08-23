import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * GET /api/admin/api-docs - Retrieve API documentation data
 * 
 * @description Fetches the generated API documentation data for the admin dashboard
 * @authentication Required - Admin access
 * @returns {Object} API routes documentation with statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Import the API documentation generator
    const { apiRoutes } = require('../../../../../scripts/generate-api-docs.js')
    
    // Run the scanner to get fresh data
    const fs = require('fs')
    const path = require('path')
    
    const API_BASE_PATH = path.join(process.cwd(), 'src/app/api')
    const routes: any[] = []
    
    // Scan for API routes
    function scanDirectory(dirPath: string, basePath: string = '') {
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name)
          const relativePath = path.join(basePath, entry.name)
          
          if (entry.isDirectory()) {
            scanDirectory(fullPath, relativePath)
          } else if (entry.name === 'route.ts') {
            const routeInfo = extractRouteInfo(fullPath, relativePath)
            if (routeInfo) {
              routes.push(routeInfo)
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error instanceof Error ? error.message : String(error))
      }
    }
    
    // Extract route information from a route file
    function extractRouteInfo(filePath: string, relativePath: string) {
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        const route = {
          path: '/' + relativePath.replace('/route.ts', '').replace(/\\/g, '/'),
          file: relativePath,
          methods: [],
          description: '',
          parameters: [],
          responses: [],
          authentication: false,
          permissions: [],
          category: ''
        }

        // Extract HTTP methods
        const methodMatches = content.match(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g)
        if (methodMatches) {
          route.methods = methodMatches.map((match: string) => match.match(/(GET|POST|PUT|DELETE|PATCH)/)![1])
        }

        // Extract description from JSDoc comments
        const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*([^@\n]+)/)
        if (descriptionMatch) {
          route.description = descriptionMatch[1].trim().replace(/\s*\*\s*/g, ' ')
        }

        // Extract authentication requirements
        if (content.includes('getServerSession') || content.includes('checkCurrentUserPermission')) {
          route.authentication = true
        }

        // Extract required permissions
        const permissionMatches = content.match(/checkCurrentUserPermission\(['"`]([^'"`]+)['"`]\)/g)
        if (permissionMatches) {
          route.permissions = permissionMatches.map((match: string) => 
            match.match(/['"`]([^'"`]+)['"`]/)![1]
          )
        }

        // Extract request parameters from destructuring
        const paramMatches = content.match(/const\s*{\s*([^}]+)\s*}\s*=\s*(body|await request\.json\(\))/g)
        if (paramMatches) {
          route.parameters = paramMatches[0]
            .replace(/const\s*{\s*/, '')
            .replace(/\s*}\s*=\s*(body|await request\.json\(\)).*/, '')
            .split(',')
            .map((param: string) => param.trim().replace(/=.*$/, '').trim())
            .filter((param: string) => param && !param.includes('//') && param.length > 0)
        }

        // Extract response codes
        const responseMatches = content.match(/status:\s*(\d+)/g)
        if (responseMatches) {
          route.responses = [...new Set(responseMatches.map((match: string) => 
            parseInt(match.match(/\d+/)![0])
          ))]
        }

        // Determine category from path
        const pathParts = route.path.split('/').filter(p => p)
        if (pathParts.length > 1) {
          route.category = pathParts[1] // First part after /api/
        } else {
          route.category = 'general'
        }

        return route
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error instanceof Error ? error.message : String(error))
        return null
      }
    }
    
    // Scan all API routes
    scanDirectory(API_BASE_PATH)
    
    // Calculate statistics
    const stats = {
      totalRoutes: routes.length,
      authenticatedRoutes: routes.filter(r => r.authentication).length,
      publicRoutes: routes.filter(r => !r.authentication).length,
      categories: new Set(routes.map(r => r.category)).size,
      methodsBreakdown: {
        GET: routes.filter(r => r.methods.includes('GET')).length,
        POST: routes.filter(r => r.methods.includes('POST')).length,
        PUT: routes.filter(r => r.methods.includes('PUT')).length,
        DELETE: routes.filter(r => r.methods.includes('DELETE')).length,
        PATCH: routes.filter(r => r.methods.includes('PATCH')).length
      }
    }
    
    return NextResponse.json({
      routes,
      stats,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    })
    
  } catch (error) {
    console.error('API Docs generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate API documentation',
      routes: [],
      stats: { totalRoutes: 0, authenticatedRoutes: 0, publicRoutes: 0, categories: 0 }
    }, { status: 500 })
  }
}