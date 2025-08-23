/**
 * Jest Test Setup
 * Sets up global test environment
 */

// Polyfill fetch for Node.js environment
import { fetch, Request, Response, Headers } from 'node-fetch'

// @ts-expect-error - Node.js fetch polyfill for global environment
global.fetch = fetch
// @ts-expect-error - Node.js Request polyfill for global environment
global.Request = Request
// @ts-expect-error - Node.js Response polyfill for global environment
global.Response = Response
// @ts-expect-error - Node.js Headers polyfill for global environment
global.Headers = Headers

// Setup test timeout
jest.setTimeout(10000)

export {}