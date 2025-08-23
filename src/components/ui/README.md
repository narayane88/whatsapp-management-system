# Modern Mantine UI Design System

A comprehensive, modern design system built on top of Mantine UI with professional aesthetics, accessibility features, and responsive design patterns suitable for enterprise and SaaS applications.

## 🎨 Design Principles

- **Modern & Minimalistic**: Clean layouts with generous whitespace
- **Professional**: Suitable for enterprise and SaaS applications  
- **Accessible**: WCAG 2.1 AA compliant with proper contrast ratios
- **Responsive**: Mobile-first design with breakpoint-aware components
- **Consistent**: Unified design tokens and component patterns
- **Performant**: Optimized with smooth transitions and micro-interactions

## 🚀 Features

### Theme System
- **Light & Dark Modes**: Full support with proper contrast ratios
- **Custom Color Palette**: Modern green-based brand colors with accessible variants
- **Typography**: Inter font family with responsive sizing
- **Shadows & Elevation**: Subtle depth with modern shadow system
- **Spacing & Layout**: Consistent spacing scale with responsive adjustments

### Components

#### Core Components (`modern-components.tsx`)
- `ModernButton` - Enhanced buttons with variants and micro-interactions
- `ModernCard` - Interactive cards with hover effects
- `ModernTextInput` - Styled form inputs with focus states
- `ModernModal` - Accessible modals with backdrop blur
- `ModernTable` - Data tables with sorting and responsive design
- `ModernBadge` - Status indicators with semantic colors
- `ModernAlert` - Notification components with proper ARIA
- `ModernProgress` - Progress indicators with smooth animations
- `ModernLoader` - Loading states with consistent styling
- `ModernContainer` - Responsive containers with size variants

#### Navigation (`modern-navigation.tsx`)
- `ModernNavLink` - Sidebar navigation with collapsible sections
- `ModernSidebar` - Complete sidebar layout with header/footer
- `ModernHeader` - Application header with search and user menu
- `ModernTabs` - Tab navigation with active states
- `ModernBreadcrumbs` - Breadcrumb navigation with click handlers

#### Accessibility (`accessibility-utils.tsx`)
- `ScreenReaderOnly` - Hidden content for screen readers
- `SkipLink` - Keyboard navigation skip links
- `AccessibleButton` - Buttons with proper ARIA attributes
- `AccessibleFormField` - Form fields with labels and error states
- `AccessibleModal` - Modals with focus management
- `AccessibleTable` - Tables with proper roles and navigation
- `LiveRegion` - Dynamic content announcements
- Color contrast utilities and WCAG compliance helpers

#### Responsive Layout (`responsive-layout.tsx`)
- `ResponsiveContainer` - Adaptive containers
- `ResponsiveSidebarLayout` - Mobile-first sidebar with drawer
- `ResponsiveCardGrid` - Auto-sizing card grids
- `ResponsiveTwoColumn` / `ResponsiveThreeColumn` - Layout components
- `ResponsiveModal` - Mobile-friendly modals
- `ResponsiveTableContainer` - Scrollable table wrapper
- Media query components (`ShowOnMobile`, `HideOnMobile`, etc.)
- Responsive hooks for text sizing and spacing

## 📱 Responsive Breakpoints

```typescript
// Mantine default breakpoints used throughout
xs: 576px
sm: 768px  
md: 1024px
lg: 1280px
xl: 1536px
```

## 🎯 Usage Examples

### Basic Setup

```tsx
import { MantineProvider } from '@mantine/core';
import { lightTheme, darkTheme } from './lib/mantine-theme';

function App() {
  const [colorScheme, setColorScheme] = useState('light');
  
  return (
    <MantineProvider 
      theme={colorScheme === 'dark' ? darkTheme : lightTheme}
      defaultColorScheme={colorScheme}
    >
      {/* Your app */}
    </MantineProvider>
  );
}
```

### Modern Components

```tsx
import { 
  Button, 
  Card, 
  TextInput, 
  Modal 
} from './components/ui/modern-components';

function MyForm() {
  return (
    <Card interactive>
      <TextInput 
        label="Email" 
        required 
        error="Invalid email"
      />
      <Button variant="primary">
        Submit
      </Button>
    </Card>
  );
}
```

### Responsive Layout

```tsx
import { 
  ResponsiveSidebarLayout,
  ResponsiveTwoColumn 
} from './components/ui/responsive-layout';

function Dashboard() {
  return (
    <ResponsiveSidebarLayout
      sidebar={<MySidebar />}
      header={<MyHeader />}
    >
      <ResponsiveTwoColumn
        left={<MainContent />}
        right={<Sidebar />}
        leftSpan={8}
        rightSpan={4}
      />
    </ResponsiveSidebarLayout>
  );
}
```

### Accessible Forms

```tsx
import { 
  AccessibleFormField,
  AccessibleButton 
} from './components/ui/accessibility-utils';

function LoginForm() {
  return (
    <form>
      <AccessibleFormField
        label="Username"
        required
        description="Enter your email or username"
        error={errors.username}
      >
        <TextInput />
      </AccessibleFormField>
      
      <AccessibleButton
        ariaLabel="Sign in to your account"
        loading={isLoading}
      >
        Sign In
      </AccessibleButton>
    </form>
  );
}
```

## 🎨 Color System

### Brand Colors
```css
--brand-50: #f0fdf4
--brand-100: #dcfce7
--brand-200: #bbf7d0
--brand-300: #86efac
--brand-400: #4ade80
--brand-500: #22c55e  /* Primary */
--brand-600: #16a34a
--brand-700: #15803d
--brand-800: #166534
--brand-900: #14532d
```

### Gray Scale
```css
--gray-50: #fafafa
--gray-100: #f4f4f5
--gray-200: #e4e4e7
--gray-300: #d4d4d8
--gray-400: #a1a1aa
--gray-500: #71717a
--gray-600: #52525b
--gray-700: #3f3f46
--gray-800: #27272a
--gray-900: #18181b
```

## ♿ Accessibility Features

- **WCAG 2.1 AA Compliance**: All components meet accessibility standards
- **Keyboard Navigation**: Full keyboard support with focus management
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: 4.5:1 minimum contrast ratio maintained
- **Focus Management**: Visible focus indicators and trap management
- **Responsive Text**: Scalable typography that works with browser zoom
- **Motion Respect**: Reduced motion support for accessibility preferences

## 🔧 Customization

### Custom Theme
```tsx
import { createTheme } from '@mantine/core';
import { lightTheme } from './lib/mantine-theme';

const customTheme = createTheme({
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    brand: [/* your custom colors */],
  },
});
```

### Component Overrides
```tsx
// Override default component styles
const customTheme = createTheme({
  components: {
    Button: {
      styles: {
        root: {
          // Custom button styles
        },
      },
    },
  },
});
```

## 📦 Dependencies

- `@mantine/core` - Core Mantine components
- `@mantine/hooks` - Utility hooks for responsive design
- `@tabler/icons-react` - Modern icon set
- `React` - Component framework

## 🛠️ Development

All components are built with TypeScript and include proper type definitions. The design system follows modern React patterns with hooks and functional components.

### File Structure
```
src/components/ui/
├── mantine-theme.ts          # Theme configuration
├── modern-components.tsx     # Core UI components  
├── modern-navigation.tsx     # Navigation components
├── accessibility-utils.tsx   # A11y utilities
├── responsive-layout.tsx     # Layout components
└── README.md                # Documentation
```

## 🎯 Best Practices

1. **Always use semantic HTML** - Proper heading hierarchy and landmarks
2. **Include ARIA labels** - For interactive elements and dynamic content
3. **Test with keyboard only** - Ensure full keyboard accessibility
4. **Check color contrast** - Use provided utilities to verify WCAG compliance
5. **Design mobile-first** - Start with mobile layouts and enhance for desktop
6. **Use consistent spacing** - Leverage the design tokens for uniform spacing
7. **Provide loading states** - Use loaders and skeletons for better UX
8. **Handle empty states** - Include proper messaging for empty data sets

## 📋 Browser Support

- Chrome 90+
- Firefox 88+  
- Safari 14+
- Edge 90+

## 📄 License

This design system is part of the WhatsApp Management System and follows the project's MIT license.

---

# WhatsApp Loading Animations

A comprehensive collection of WhatsApp-themed loading animations for your React application.

## Components Overview

### 1. WhatsAppLoader
The main loader component with multiple variants.

```tsx
import WhatsAppLoader from '@/components/ui/WhatsAppLoader'

// Basic usage
<WhatsAppLoader variant="default" message="Loading..." size="md" />
```

#### Props
- `variant`: `'default' | 'typing' | 'connecting' | 'sending' | 'compact'`
- `message`: Optional loading message
- `size`: `'sm' | 'md' | 'lg'`
- `showIcon`: Boolean to show/hide icon

#### Variants

**Default**
- Green WhatsApp icon with pulsing animation
- Animated dots for message
```tsx
<WhatsAppLoader variant="default" message="Loading messages..." />
```

**Typing**
- Animated dots in a message bubble style
- Perfect for "someone is typing" indicators
```tsx
<WhatsAppLoader variant="typing" message="Someone is typing..." />
```

**Connecting**
- WiFi icon with spinning animation inside green circle
- Ideal for connection states
```tsx
<WhatsAppLoader variant="connecting" message="Establishing connection..." />
```

**Sending**
- Double check icon with sliding animation
- Great for message sending states
```tsx
<WhatsAppLoader variant="sending" message="Sending message..." />
```

**Compact**
- Small inline loader with icon and text
- Perfect for buttons and small spaces
```tsx
<WhatsAppLoader variant="compact" message="Processing..." />
```

### 2. WhatsAppMessageLoader
Message bubble style loader that simulates WhatsApp conversation loading.

```tsx
import { WhatsAppMessageLoader } from '@/components/ui/WhatsAppLoader'

<WhatsAppMessageLoader 
  messages={[
    'Connecting to WhatsApp...',
    'Loading conversations...',
    'Almost ready...'
  ]}
  currentIndex={1}
/>
```

### 3. WhatsAppSectionLoader
Section-level loader for page sections.

```tsx
import { WhatsAppSectionLoader } from '@/components/ui/WhatsAppLoader'

<WhatsAppSectionLoader 
  title="Loading devices..." 
  subtitle="Connecting to WhatsApp servers"
/>

// Compact version
<WhatsAppSectionLoader 
  title="Processing..." 
  variant="compact"
/>
```

### 4. WhatsAppPageLoader
Full-screen loading overlay with progress and advanced animations.

```tsx
import WhatsAppPageLoader from '@/components/ui/WhatsAppPageLoader'

<WhatsAppPageLoader
  variant="connecting"
  showProgress={true}
  fullScreen={true}
/>
```

#### Props
- `variant`: `'connecting' | 'loading' | 'sending' | 'custom'`
- `customMessage`: Custom message for 'custom' variant
- `showProgress`: Show progress bar
- `fullScreen`: Full screen overlay
- `backgroundColor`: Custom background color

## Loading Provider

Use the LoadingProvider for global loading state management.

### Setup

```tsx
// In your app root or layout
import { LoadingProvider } from '@/components/providers/LoadingProvider'

function App() {
  return (
    <LoadingProvider>
      <YourAppContent />
    </LoadingProvider>
  )
}
```

### Usage

```tsx
import { useLoading, useLoadingApi } from '@/components/providers/LoadingProvider'

function MyComponent() {
  const { showLoading, hideLoading } = useLoading()
  const { withLoading } = useLoadingApi()

  // Manual control
  const handleAction = () => {
    showLoading('connecting', 'Custom message', true)
    setTimeout(() => hideLoading(), 3000)
  }

  // Automatic API wrapper
  const handleApiCall = async () => {
    await withLoading(
      () => fetch('/api/data').then(res => res.json()),
      { 
        variant: 'loading', 
        message: 'Fetching data...',
        showProgress: true 
      }
    )
  }
}
```

## Integration Examples

### In Page Components

```tsx
// Replace standard loading states
if (loading) {
  return (
    <WhatsAppSectionLoader 
      title="Loading WhatsApp devices..." 
      subtitle="Connecting to your WhatsApp servers"
    />
  )
}
```

### In Table Rows

```tsx
// Show inline loaders for connecting devices
<Table.Td>
  {device.status === 'CONNECTING' ? (
    <WhatsAppLoader 
      variant="connecting" 
      message="Connecting..."
      size="sm"
      showIcon={false}
    />
  ) : (
    <Badge color={getStatusColor(device.status)}>
      {device.status}
    </Badge>
  )}
</Table.Td>
```

### In Buttons

```tsx
// Button with loading state
<Button
  onClick={handleSubmit}
  leftSection={
    isLoading ? (
      <WhatsAppLoader variant="compact" size="sm" showIcon={false} />
    ) : (
      <IconSend />
    )
  }
>
  {isLoading ? 'Sending...' : 'Send Message'}
</Button>
```

### Global Loading

```tsx
// For full-screen loading during API calls
const handleLongOperation = async () => {
  const { withLoading } = useLoadingApi()
  
  await withLoading(
    () => performLongOperation(),
    { 
      variant: 'sending',
      message: 'Processing your request...',
      showProgress: true
    }
  )
}
```

## CSS Animations

Additional CSS classes are available in `@/styles/whatsapp-animations.css`:

- `.whatsapp-pulse` - Pulsing animation
- `.whatsapp-bounce` - Bouncing animation
- `.whatsapp-typing-dots` - Typing indicator dots
- `.whatsapp-message-bubble` - Message bubble appearance
- `.whatsapp-connection-wave` - Connection wave animation
- `.whatsapp-check-animation` - Check mark animation
- `.whatsapp-spinner` - Simple spinner
- `.whatsapp-shimmer` - Shimmer loading effect

### Usage

```tsx
<div className="whatsapp-pulse">
  Content with pulse animation
</div>

<div className="whatsapp-shimmer" style={{ height: 20, borderRadius: 4 }}>
  {/* Shimmer placeholder */}
</div>
```

## Best Practices

1. **Choose the right variant**: 
   - Use `connecting` for network operations
   - Use `typing` for real-time interactions
   - Use `sending` for message/data transmission
   - Use `compact` for inline/button loading states

2. **Progressive loading**: Start with section loaders, then show specific component loaders

3. **Consistent messaging**: Use clear, action-specific messages

4. **Responsive design**: All loaders are responsive and work on mobile devices

5. **Dark mode**: Components support both light and dark themes

## Demo Page

Visit `/admin/whatsapp-loaders` to see all loading animations in action with interactive examples.

## Customization

All components use Mantine's theme system and can be customized through CSS-in-JS or CSS variables:

```tsx
// Custom colors
<WhatsAppLoader 
  variant="connecting" 
  style={{ '--whatsapp-green': '#128c7e' }}
/>
```

## Performance

- All animations use CSS transforms and opacity for optimal performance
- Components are memoized to prevent unnecessary re-renders
- Minimal bundle size impact with tree-shaking support