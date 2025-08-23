import React from 'react';
import {
  Box,
  VisuallyHidden,
  Text,
  Group,
  Stack,
  FocusTrap,
  useMantineTheme,
  rem,
} from '@mantine/core';
import { useHotkeys, useMediaQuery } from '@mantine/hooks';

// Screen Reader Only Component
export const ScreenReaderOnly = ({ children, ...props }: any) => {
  return (
    <VisuallyHidden {...props}>
      {children}
    </VisuallyHidden>
  );
};

// Skip Link Component for keyboard navigation
export const SkipLink = ({ href = '#main-content', children = 'Skip to main content', ...props }: any) => {
  const theme = useMantineTheme();
  
  return (
    <Box
      component="a"
      href={href}
      style={{
        position: 'absolute',
        left: rem(-9999),
        top: rem(0),
        zIndex: 9999,
        padding: `${rem(8)} ${rem(16)}`,
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[9] : theme.colors.gray[9],
        color: theme.white,
        textDecoration: 'none',
        borderRadius: rem(4),
        fontSize: rem(14),
        fontWeight: 500,
        
        '&:focus': {
          left: rem(16),
          top: rem(16),
        },
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

// High Contrast Mode Component
export const HighContrastBox = ({ 
  children, 
  highContrast = false, 
  role,
  ...props 
}: any) => {
  const theme = useMantineTheme();
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)');
  const shouldUseHighContrast = highContrast || prefersHighContrast;
  
  return (
    <Box
      role={role}
      style={shouldUseHighContrast ? {
        backgroundColor: theme.colorScheme === 'dark' ? '#000000' : '#ffffff',
        color: theme.colorScheme === 'dark' ? '#ffffff' : '#000000',
        border: `2px solid ${theme.colorScheme === 'dark' ? '#ffffff' : '#000000'}`,
      } : {}}
      {...props}
    >
      {children}
    </Box>
  );
};

// Focus Management Component
export const FocusManager = ({ 
  children, 
  active = true, 
  restoreFocus = true,
  ...props 
}: any) => {
  return (
    <FocusTrap active={active} restoreFocus={restoreFocus} {...props}>
      {children}
    </FocusTrap>
  );
};

// Accessible Button Component with proper ARIA attributes
export const AccessibleButton = React.forwardRef<HTMLButtonElement, any>(
  ({ 
    children, 
    ariaLabel, 
    ariaDescribedBy,
    ariaExpanded,
    ariaControls,
    disabled = false,
    loading = false,
    onClick,
    ...props 
  }, ref) => {
    const theme = useMantineTheme();
    
    return (
      <Box
        component="button"
        ref={ref}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-disabled={disabled || loading}
        disabled={disabled || loading}
        onClick={onClick}
        style={{
          border: 'none',
          backgroundColor: 'transparent',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          padding: `${rem(8)} ${rem(16)}`,
          borderRadius: rem(8),
          transition: 'all 0.15s ease',
          position: 'relative',
          
          '&:focus-visible': {
            outline: `2px solid ${theme.colors.blue[6]}`,
            outlineOffset: rem(2),
          },
          
          '&:hover:not(:disabled)': {
            backgroundColor: theme.colorScheme === 'dark' 
              ? theme.colors.dark[6] 
              : theme.colors.gray[1],
          },
        }}
        {...props}
      >
        {loading && (
          <ScreenReaderOnly>
            Loading...
          </ScreenReaderOnly>
        )}
        {children}
      </Box>
    );
  }
);

// Accessible Form Field Component
export const AccessibleFormField = ({ 
  label, 
  required = false, 
  error, 
  description, 
  children, 
  id,
  ...props 
}: any) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const theme = useMantineTheme();
  
  return (
    <Stack gap={4} {...props}>
      <Box component="label" htmlFor={fieldId}>
        <Text 
          size="sm" 
          fw={500}
          style={{
            color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[9],
          }}
        >
          {label}
          {required && (
            <Text component="span" c="red" ml={4} aria-label="required">
              *
            </Text>
          )}
        </Text>
      </Box>
      
      {description && (
        <Text 
          id={descriptionId} 
          size="xs" 
          c="dimmed"
          style={{ marginBottom: rem(4) }}
        >
          {description}
        </Text>
      )}
      
      {React.cloneElement(children, {
        id: fieldId,
        'aria-required': required,
        'aria-invalid': !!error,
        'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
      })}
      
      {error && (
        <Text 
          id={errorId} 
          size="xs" 
          c="red"
          role="alert"
          aria-live="polite"
        >
          {error}
        </Text>
      )}
    </Stack>
  );
};

// Accessible Modal Component
export const AccessibleModal = ({ 
  children, 
  title, 
  opened, 
  onClose, 
  trapFocus = true,
  closeOnEscape = true,
  ...props 
}: any) => {
  const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;
  
  // Handle escape key
  useHotkeys([
    ['escape', closeOnEscape ? onClose : () => {}],
  ]);
  
  if (!opened) return null;
  
  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Overlay */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
      />
      
      {/* Modal Content */}
      <FocusManager active={trapFocus}>
        <Box
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          style={{
            position: 'relative',
            zIndex: 1001,
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
          }}
          {...props}
        >
          {title && (
            <ScreenReaderOnly>
              <Text id={titleId} component="h2">
                {title}
              </Text>
            </ScreenReaderOnly>
          )}
          {children}
        </Box>
      </FocusManager>
    </Box>
  );
};

// Live Region Component for dynamic content updates
export const LiveRegion = ({ 
  children, 
  politeness = 'polite', 
  atomic = false,
  ...props 
}: any) => {
  return (
    <Box
      aria-live={politeness}
      aria-atomic={atomic}
      style={{
        position: 'absolute',
        left: rem(-10000),
        width: rem(1),
        height: rem(1),
        overflow: 'hidden',
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

// Accessible Table Component
export const AccessibleTable = ({ 
  data, 
  columns, 
  caption, 
  sortable = false,
  ...props 
}: any) => {
  const theme = useMantineTheme();
  
  return (
    <Box style={{ overflowX: 'auto' }}>
      <Box
        component="table"
        role="table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        }}
        {...props}
      >
        {caption && (
          <Box component="caption" style={{ padding: rem(16), textAlign: 'left' }}>
            <Text fw={600}>{caption}</Text>
          </Box>
        )}
        
        <Box component="thead">
          <Box component="tr">
            {columns?.map((column: any, index: number) => (
              <Box
                key={index}
                component="th"
                scope="col"
                role="columnheader"
                aria-sort={sortable && column.sortable ? 'none' : undefined}
                style={{
                  padding: `${rem(12)} ${rem(16)}`,
                  textAlign: 'left',
                  backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                  borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}`,
                  fontWeight: 600,
                  fontSize: rem(14),
                  color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[9],
                }}
              >
                {column.header}
              </Box>
            ))}
          </Box>
        </Box>
        
        <Box component="tbody">
          {data?.map((row: any, rowIndex: number) => (
            <Box 
              key={rowIndex} 
              component="tr"
              style={{
                '&:hover': {
                  backgroundColor: theme.colorScheme === 'dark' 
                    ? theme.colors.dark[6] 
                    : theme.colors.gray[0],
                },
              }}
            >
              {columns?.map((column: any, colIndex: number) => (
                <Box
                  key={colIndex}
                  component="td"
                  role="gridcell"
                  style={{
                    padding: `${rem(12)} ${rem(16)}`,
                    borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
                    fontSize: rem(14),
                    color: theme.colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[7],
                  }}
                >
                  {typeof column.accessor === 'function' 
                    ? column.accessor(row) 
                    : row[column.accessor]}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

// Color Contrast Utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd want a more robust color contrast library
  const getLuminance = (color: string) => {
    // This is a simplified version - use a proper color library in production
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

export const meetsWCAGStandards = (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
};

// Export all accessibility components and utilities
export {
  ScreenReaderOnly,
  SkipLink,
  HighContrastBox,
  FocusManager,
  AccessibleButton,
  AccessibleFormField,
  AccessibleModal,
  LiveRegion,
  AccessibleTable,
  getContrastRatio,
  meetsWCAGStandards,
};