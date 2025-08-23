import { 
  FiPlay, 
  FiPause, 
  FiRotateCcw, 
  FiEdit3, 
  FiTrash2, 
  FiEye, 
  FiCamera, 
  FiLink,
  FiDownload,
  FiSettings,
  FiMonitor,
  FiActivity
} from 'react-icons/fi'
import { ServerListConfig, ServerListAction } from './ServerList'

// Predefined quick actions
export const QUICK_ACTIONS = {
  VIEW: {
    id: 'view',
    label: 'View',
    icon: FiEye,
    color: 'blue',
    variant: 'light' as const,
    tooltip: 'View server details',
    onClick: (server) => console.log('View server:', server.name)
  },

  START: {
    id: 'start',
    label: 'Start',
    icon: FiPlay,
    color: 'green',
    variant: 'light' as const,
    tooltip: 'Start server',
    disabled: (server) => server.status === 'Online',
    loading: (server, loadingStates) => loadingStates[server.id] === 'start',
    onClick: (server) => console.log('Start server:', server.name)
  },

  STOP: {
    id: 'stop',
    label: 'Stop',
    icon: FiPause,
    color: 'orange',
    variant: 'light' as const,
    tooltip: 'Stop server',
    disabled: (server) => server.status === 'Offline',
    loading: (server, loadingStates) => loadingStates[server.id] === 'stop',
    onClick: (server) => console.log('Stop server:', server.name)
  },

  RESTART: {
    id: 'restart',
    label: 'Restart',
    icon: FiRotateCcw,
    color: 'blue',
    variant: 'light' as const,
    tooltip: 'Restart server',
    disabled: (server) => server.status === 'Offline',
    loading: (server, loadingStates) => loadingStates[server.id] === 'restart',
    onClick: (server) => console.log('Restart server:', server.name)
  },

  EDIT: {
    id: 'edit',
    label: 'Edit',
    icon: FiEdit3,
    color: 'gray',
    variant: 'light' as const,
    tooltip: 'Edit server settings',
    onClick: (server) => console.log('Edit server:', server.name)
  },

  DELETE: {
    id: 'delete',
    label: 'Delete',
    icon: FiTrash2,
    color: 'red',
    variant: 'light' as const,
    tooltip: 'Delete server',
    onClick: (server) => console.log('Delete server:', server.name)
  },

  QR_CODE: {
    id: 'qr',
    label: 'QR Code',
    icon: FiCamera,
    color: 'blue',
    variant: 'light' as const,
    tooltip: 'Get QR code',
    onClick: (server) => console.log('Get QR code for:', server.name)
  },

  DISCONNECT: {
    id: 'disconnect',
    label: 'Disconnect',
    icon: FiLink,
    color: 'red',
    variant: 'light' as const,
    tooltip: 'Disconnect account',
    disabled: (server) => server.status === 'Offline',
    onClick: (server) => console.log('Disconnect:', server.name)
  },

  MONITOR: {
    id: 'monitor',
    label: 'Monitor',
    icon: FiMonitor,
    color: 'purple',
    variant: 'light' as const,
    tooltip: 'View monitoring dashboard',
    onClick: (server) => console.log('Monitor server:', server.name)
  },

  LOGS: {
    id: 'logs',
    label: 'Logs',
    icon: FiActivity,
    color: 'gray',
    variant: 'light' as const,
    tooltip: 'View server logs',
    onClick: (server) => console.log('View logs for:', server.name)
  }
} as const satisfies Record<string, ServerListAction>

// Predefined configurations for common use cases
export const SERVER_LIST_CONFIGS = {
  // Full-featured admin dashboard
  ADMIN_DASHBOARD: {
    layout: 'cards',
    theme: 'green',
    showStats: true,
    showResources: true,
    showActions: true,
    showDetails: true,
    compact: false,
    columns: { base: 1, lg: 2, xl: 3 },
    spacing: 'lg',
    quickActions: [
      QUICK_ACTIONS.VIEW,
      QUICK_ACTIONS.START,
      QUICK_ACTIONS.STOP,
      QUICK_ACTIONS.RESTART
    ],
    menuActions: [
      QUICK_ACTIONS.EDIT,
      QUICK_ACTIONS.MONITOR,
      QUICK_ACTIONS.LOGS,
      QUICK_ACTIONS.DELETE
    ]
  } as ServerListConfig,

  // Compact monitoring view
  MONITORING_VIEW: {
    layout: 'grid',
    theme: 'blue',
    showStats: true,
    showResources: true,
    showActions: false,
    showDetails: false,
    compact: true,
    columns: { base: 2, md: 3, lg: 4, xl: 6 },
    spacing: 'sm'
  } as ServerListConfig,

  // WhatsApp account management
  WHATSAPP_ACCOUNTS: {
    layout: 'cards',
    theme: 'green',
    showStats: false,
    showResources: false,
    showActions: true,
    showDetails: true,
    compact: false,
    columns: { base: 1, md: 2 },
    spacing: 'md',
    quickActions: [
      QUICK_ACTIONS.VIEW,
      QUICK_ACTIONS.QR_CODE
    ],
    menuActions: [
      QUICK_ACTIONS.DISCONNECT,
      QUICK_ACTIONS.EDIT,
      QUICK_ACTIONS.DELETE
    ],
    // Filter only WhatsApp-related servers
    filter: (server) => server.whatsappInstances !== undefined && server.whatsappInstances > 0
  } as ServerListConfig,

  // Simple server status list
  STATUS_LIST: {
    layout: 'list',
    theme: 'default',
    showStats: false,
    showResources: false,
    showActions: false,
    showDetails: false,
    compact: true,
    spacing: 'xs'
  } as ServerListConfig,

  // Production servers only
  PRODUCTION_ONLY: {
    layout: 'cards',
    theme: 'blue',
    showStats: true,
    showResources: true,
    showActions: true,
    showDetails: true,
    compact: false,
    columns: { base: 1, lg: 2 },
    spacing: 'lg',
    quickActions: [
      QUICK_ACTIONS.VIEW,
      QUICK_ACTIONS.MONITOR,
      QUICK_ACTIONS.RESTART
    ],
    menuActions: [
      QUICK_ACTIONS.LOGS,
      QUICK_ACTIONS.EDIT
    ],
    // Filter only production servers
    filter: (server) => server.environment === 'Production',
    // Sort by status (Online first)
    sort: (a, b) => {
      if (a.status === 'Online' && b.status !== 'Online') return -1
      if (a.status !== 'Online' && b.status === 'Online') return 1
      return a.name.localeCompare(b.name)
    }
  } as ServerListConfig,

  // Development servers
  DEVELOPMENT_SERVERS: {
    layout: 'cards',
    theme: 'purple',
    showStats: false,
    showResources: true,
    showActions: true,
    showDetails: true,
    compact: false,
    columns: { base: 1, md: 2, lg: 3 },
    spacing: 'md',
    quickActions: [
      QUICK_ACTIONS.VIEW,
      QUICK_ACTIONS.START,
      QUICK_ACTIONS.STOP,
      QUICK_ACTIONS.RESTART
    ],
    menuActions: [
      QUICK_ACTIONS.EDIT,
      QUICK_ACTIONS.LOGS,
      QUICK_ACTIONS.DELETE
    ],
    filter: (server) => server.environment === 'Development'
  } as ServerListConfig,

  // Customer dashboard view (limited actions)
  CUSTOMER_VIEW: {
    layout: 'cards',
    theme: 'green',
    showStats: false,
    showResources: false,
    showActions: true,
    showDetails: true,
    compact: false,
    columns: { base: 1, md: 2 },
    spacing: 'md',
    quickActions: [
      QUICK_ACTIONS.VIEW,
      QUICK_ACTIONS.QR_CODE
    ],
    // No dangerous actions for customers
    menuActions: []
  } as ServerListConfig,

  // Mobile optimized
  MOBILE_OPTIMIZED: {
    layout: 'list',
    theme: 'default',
    showStats: false,
    showResources: false,
    showActions: true,
    showDetails: false,
    compact: true,
    columns: { base: 1 },
    spacing: 'xs',
    quickActions: [
      QUICK_ACTIONS.VIEW
    ]
  } as ServerListConfig
} as const

// Helper function to create custom configurations
export function createServerListConfig(
  baseConfig: keyof typeof SERVER_LIST_CONFIGS,
  overrides: Partial<ServerListConfig> = {}
): ServerListConfig {
  return {
    ...SERVER_LIST_CONFIGS[baseConfig],
    ...overrides
  }
}

// Helper function to create custom actions
export function createServerAction(
  baseAction: keyof typeof QUICK_ACTIONS,
  overrides: Partial<ServerListAction> = {}
): ServerListAction {
  return {
    ...QUICK_ACTIONS[baseAction],
    ...overrides
  }
}

// Permission-based action filtering
export function filterActionsByPermission(
  actions: ServerListAction[],
  permissions: string[]
): ServerListAction[] {
  return actions.filter(action => 
    !action.permission || permissions.includes(action.permission)
  )
}