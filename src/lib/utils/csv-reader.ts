import fs from 'fs/promises'
import path from 'path'

export interface ApiCredentials {
  keyId: string
  keySecret: string
  webhookSecret: string
}

export interface ApiKeysMap {
  [service: string]: ApiCredentials
}

/**
 * Reads API credentials from the api-key.csv file
 * Expected CSV format:
 * service,key_id,key_secret,webhook_secret
 * razorpay,rzp_test_xxxxx,your_secret,webhook_secret
 */
export async function readApiKeysFromCSV(): Promise<ApiKeysMap> {
  try {
    const csvFile = path.join(process.cwd(), 'api-key.csv')
    
    // Check if file exists
    try {
      await fs.access(csvFile)
    } catch {
      console.warn('api-key.csv file not found. Using default configuration.')
      return {}
    }
    
    const csvData = await fs.readFile(csvFile, 'utf8')
    const lines = csvData.trim().split('\n')
    
    if (lines.length < 2) {
      console.warn('api-key.csv file is empty or missing data rows.')
      return {}
    }
    
    const headers = lines[0].split(',').map(h => h.trim())
    const apiKeys: ApiKeysMap = {}
    
    // Validate headers
    const expectedHeaders = ['service', 'key_id', 'key_secret', 'webhook_secret']
    const hasValidHeaders = expectedHeaders.every(header => headers.includes(header))
    
    if (!hasValidHeaders) {
      console.error('Invalid CSV headers. Expected:', expectedHeaders, 'Got:', headers)
      return {}
    }
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      
      if (values.length >= 4) {
        const service = values[0]
        const keyId = values[1]
        const keySecret = values[2]
        const webhookSecret = values[3]
        
        // Skip rows with placeholder values
        if (keyId && isValidApiCredential(keyId)) {
          apiKeys[service] = {
            keyId,
            keySecret,
            webhookSecret
          }
          console.log(`✅ Loaded credentials for ${service} from CSV`)
        } else {
          console.log(`⚠️ Skipped ${service} - placeholder credentials detected`)
        }
      }
    }
    
    return apiKeys
  } catch (error) {
    console.error('Error reading API keys from CSV:', error)
    return {}
  }
}

/**
 * Validates if the API credentials are real (not placeholder values)
 */
export function isValidApiCredential(credential: string): boolean {
  if (!credential) return false
  
  const placeholders = [
    'your_key_id_here',
    'your_key_secret_here', 
    'your_webhook_secret_here',
    'xxxxx',
    'demo_key_id',
    'demo_secret',
    'PUT_YOUR_ACTUAL_KEY_HERE',
    'PUT_YOUR_ACTUAL_SECRET_HERE',
    'PUT_YOUR_WEBHOOK_SECRET_HERE'
  ]
  
  return !placeholders.some(placeholder => credential.includes(placeholder))
}

/**
 * Gets Razorpay credentials specifically
 */
export async function getRazorpayCredentials(): Promise<ApiCredentials | null> {
  const apiKeys = await readApiKeysFromCSV()
  return apiKeys.razorpay || null
}