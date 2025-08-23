# ServerList Component

A highly configurable and reusable server list component for displaying and managing server infrastructure in various layouts and configurations.

## Features

- **Multiple Layouts**: Grid, cards, and list layouts
- **Configurable Themes**: Green, blue, purple, orange, or default
- **Flexible Actions**: Quick actions, menu actions, and custom callbacks  
- **Resource Monitoring**: CPU, memory, storage, and network usage
- **Status Management**: Online, offline, maintenance, warning states
- **Responsive Design**: Adapts to different screen sizes
- **Custom Rendering**: Override any component with custom renderers
- **Permission-based**: Actions can be filtered by user permissions
- **Loading States**: Per-server loading indicators
- **Filtering & Sorting**: Built-in filter and sort capabilities

## Basic Usage

```tsx
import { ServerList, SERVER_LIST_CONFIGS } from '@/components/servers'

function MyServerDashboard() {
  const servers = [
    {
      id: 1,
      name: 'WA-Server-01',
      status: 'Online',
      environment: 'Production',
      // ... other server properties
    }
  ]

  return (
    <ServerList
      servers={servers}
      config={SERVER_LIST_CONFIGS.ADMIN_DASHBOARD}
    />
  )
}
```

## Server Configuration

### ServerConfig Interface

```tsx
interface ServerConfig {
  id: string | number
  name: string
  hostname?: string
  ipAddress?: string
  port?: number
  status: 'Online' | 'Offline' | 'Maintenance' | 'Warning' | 'Connecting' | 'Error'
  environment?: 'Production' | 'Staging' | 'Development'
  location?: string
  capacity?: number
  activeUsers?: number
  messagesPerDay?: number
  uptime?: number
  lastHeartbeat?: string
  version?: string
  resources?: {
    cpu?: number
    memory?: number
    storage?: number
    network?: number
  }
  whatsappInstances?: number
  createdAt?: string
  updatedAt?: string
  metadata?: Record<string, any>
}
```

## Layout Configurations

### 1. Admin Dashboard (Full Featured)
```tsx
config={SERVER_LIST_CONFIGS.ADMIN_DASHBOARD}
```
- Layout: Cards
- Theme: Green
- Shows: Stats, resources, actions, details
- Actions: Start, stop, restart, edit, monitor, logs, delete

### 2. Monitoring View (Compact)
```tsx
config={SERVER_LIST_CONFIGS.MONITORING_VIEW}
```
- Layout: Grid
- Theme: Blue
- Shows: Stats, resources
- No actions (view-only)
- Compact design for dashboards

### 3. WhatsApp Accounts
```tsx
config={SERVER_LIST_CONFIGS.WHATSAPP_ACCOUNTS}
```
- Layout: Cards
- Theme: Green
- Filtered: Only shows servers with WhatsApp instances
- Actions: View, QR code, disconnect, edit, delete

### 4. Status List (Minimal)
```tsx
config={SERVER_LIST_CONFIGS.STATUS_LIST}
```
- Layout: List
- Theme: Default
- Shows: Basic server info only
- No actions or resource details

### 5. Production Only
```tsx
config={SERVER_LIST_CONFIGS.PRODUCTION_ONLY}
```
- Layout: Cards
- Theme: Blue
- Filtered: Only production servers
- Sorted: Online servers first
- Actions: View, monitor, restart, logs, edit

## Custom Configuration

### Creating Custom Configs
```tsx
import { createServerListConfig, QUICK_ACTIONS } from '@/components/servers'

const customConfig = createServerListConfig('ADMIN_DASHBOARD', {
  theme: 'purple',
  compact: true,
  quickActions: [
    QUICK_ACTIONS.VIEW,
    QUICK_ACTIONS.RESTART
  ],
  onServerClick: (server) => {
    console.log('Server clicked:', server.name)
  },
  filter: (server) => server.environment === 'Production'
})
```

### Custom Actions
```tsx
import { createServerAction } from '@/components/servers'

const customAction = createServerAction('START', {
  color: 'purple',
  tooltip: 'Start my custom server',
  onClick: async (server) => {
    // Custom start logic
    await startCustomServer(server.id)
  },
  permission: 'servers.start'
})
```

## Advanced Usage

### With Loading States
```tsx
function ServerManager() {
  const [loadingStates, setLoadingStates] = useState({})
  
  const handleAction = async (action, server) => {
    setLoadingStates(prev => ({ ...prev, [server.id]: action }))
    try {
      await performAction(action, server)
    } finally {
      setLoadingStates(prev => ({ ...prev, [server.id]: null }))
    }
  }

  return (
    <ServerList
      servers={servers}
      config={config}
      loadingStates={loadingStates}
    />
  )
}
```

### With Custom Renderers
```tsx
const customConfig = {
  ...SERVER_LIST_CONFIGS.ADMIN_DASHBOARD,
  customStatusBadge: (status) => (
    <Badge color={status === 'Online' ? 'green' : 'red'}>
      {status === 'Online' ? '🟢 Online' : '🔴 Offline'}
    </Badge>
  ),
  customResourceDisplay: (resources) => (
    <div>CPU: {resources?.cpu}% | RAM: {resources?.memory}%</div>
  ),
  customServerCard: (server, defaultCard) => (
    <div style={{ border: '2px solid gold' }}>
      {defaultCard}
    </div>
  )
}
```

### With Permissions
```tsx
import { filterActionsByPermission } from '@/components/servers'

const userPermissions = ['servers.view', 'servers.restart']
const allowedActions = filterActionsByPermission(allActions, userPermissions)

const config = {
  ...SERVER_LIST_CONFIGS.ADMIN_DASHBOARD,
  quickActions: allowedActions
}
```

## Available Quick Actions

- `VIEW`: View server details
- `START`: Start server
- `STOP`: Stop server  
- `RESTART`: Restart server
- `EDIT`: Edit server settings
- `DELETE`: Delete server
- `QR_CODE`: Get QR code (for WhatsApp)
- `DISCONNECT`: Disconnect account
- `MONITOR`: View monitoring dashboard
- `LOGS`: View server logs

## Theme Colors

- `green`: Green/emerald theme (default for servers)
- `blue`: Blue/cyan theme (good for monitoring)
- `purple`: Purple/violet theme (good for development)
- `orange`: Orange/amber theme (good for warnings)
- `default`: Gray/neutral theme

## Props Reference

### ServerList Props
```tsx
interface ServerListProps {
  servers: ServerConfig[]
  config: ServerListConfig
  loading?: boolean
  error?: string | null
  loadingStates?: Record<string, string | null>
  className?: string
  style?: React.CSSProperties
}
```

### ServerListConfig Options
```tsx
interface ServerListConfig {
  // Display options
  layout: 'grid' | 'list' | 'cards'
  showStats?: boolean
  showResources?: boolean
  showActions?: boolean
  showDetails?: boolean
  compact?: boolean
  
  // Grid options
  columns?: { base: number, sm?: number, md?: number, lg?: number, xl?: number }
  
  // Styling
  theme?: 'default' | 'green' | 'blue' | 'purple' | 'orange'
  borderRadius?: number
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  
  // Actions
  quickActions?: ServerListAction[]
  menuActions?: ServerListAction[]
  
  // Callbacks
  onServerClick?: (server: ServerConfig) => void
  onServerDoubleClick?: (server: ServerConfig) => void
  onRefresh?: () => void
  
  // Filtering & Sorting
  filter?: (server: ServerConfig) => boolean
  sort?: (a: ServerConfig, b: ServerConfig) => number
  
  // Custom renderers
  customServerCard?: (server: ServerConfig, defaultCard: React.ReactNode) => React.ReactNode
  customResourceDisplay?: (resources: ServerConfig['resources']) => React.ReactNode
  customStatusBadge?: (status: ServerConfig['status']) => React.ReactNode
}
```

## Examples

See `ServerListExamples.tsx` for complete working examples including:
- Configuration demo with live switching
- WhatsApp server dashboard
- Server status widget
- Monitoring dashboard

## Integration with Baileys Server

The component works seamlessly with the Baileys WhatsApp server:

```tsx
// Connect to Baileys server running on localhost:3005
const baileyServer = {
  id: 'baileys-local',
  name: 'Local Baileys Server',
  hostname: 'localhost',
  ipAddress: '127.0.0.1',
  port: 3005,
  status: 'Online',
  environment: 'Development',
  whatsappInstances: 0,
  version: '1.0.0'
}

<ServerList
  servers={[baileyServer, ...otherServers]}
  config={SERVER_LIST_CONFIGS.WHATSAPP_ACCOUNTS}
/>
```

This creates a powerful, flexible server management interface that can adapt to any use case while maintaining consistency across your application.