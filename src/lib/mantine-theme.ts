import { createTheme, MantineColorsTuple, rem, rgba } from '@mantine/core';

// Modern color palette with improved accessibility and contrast
const brandColors: MantineColorsTuple = [
  '#f0fdf4',
  '#dcfce7', 
  '#bbf7d0',
  '#86efac',
  '#4ade80',
  '#22c55e',
  '#16a34a',
  '#15803d',
  '#166534',
  '#14532d'
];

const grayColors: MantineColorsTuple = [
  '#fafafa',
  '#f4f4f5',
  '#e4e4e7',
  '#d4d4d8',
  '#a1a1aa',
  '#71717a',
  '#52525b',
  '#3f3f46',
  '#27272a',
  '#18181b'
];

const blueColors: MantineColorsTuple = [
  '#eff6ff',
  '#dbeafe',
  '#bfdbfe',
  '#93c5fd',
  '#60a5fa',
  '#3b82f6',
  '#2563eb',
  '#1d4ed8',
  '#1e40af',
  '#1e3a8a'
];

// Common theme configurations
const commonTheme = {
  primaryColor: 'brand',
  colors: {
    brand: brandColors,
    gray: grayColors,
    blue: blueColors,
  },
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
  headings: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: rem(36), lineHeight: '1.2' },
      h2: { fontSize: rem(30), lineHeight: '1.3' },
      h3: { fontSize: rem(24), lineHeight: '1.4' },
      h4: { fontSize: rem(20), lineHeight: '1.45' },
      h5: { fontSize: rem(18), lineHeight: '1.5' },
      h6: { fontSize: rem(16), lineHeight: '1.5' },
    },
  },
  fontSizes: {
    xs: rem(12),
    sm: rem(14),
    md: rem(16),
    lg: rem(18),
    xl: rem(20),
  },
  radius: {
    xs: rem(4),
    sm: rem(6),
    md: rem(8),
    lg: rem(12),
    xl: rem(16),
  },
  spacing: {
    xs: rem(8),
    sm: rem(12),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
  },
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
};

// Light theme
export const lightTheme = createTheme({
  ...commonTheme,
  white: '#ffffff',
  black: '#000000',
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        size: 'md',
      },
      styles: {
        root: {
          fontWeight: 500,
          transition: 'all 0.15s ease',
          border: 'none',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      },
      variants: {
        primary: (theme) => ({
          root: {
            backgroundColor: theme.colors.brand[6],
            color: theme.white,
            '&:hover': {
              backgroundColor: theme.colors.brand[7],
            },
          },
        }),
        secondary: (theme) => ({
          root: {
            backgroundColor: theme.colors.gray[1],
            color: theme.colors.gray[9],
            border: `1px solid ${theme.colors.gray[3]}`,
            '&:hover': {
              backgroundColor: theme.colors.gray[2],
            },
          },
        }),
        ghost: (theme) => ({
          root: {
            backgroundColor: 'transparent',
            color: theme.colors.gray[7],
            '&:hover': {
              backgroundColor: theme.colors.gray[1],
            },
          },
        }),
      },
    },
    Card: {
      defaultProps: {
        shadow: 'sm',
        radius: 'lg',
        withBorder: true,
        padding: 'lg',
      },
      styles: {
        root: {
          backgroundColor: '#ffffff',
          borderColor: '#f1f5f9',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    Paper: {
      defaultProps: {
        shadow: 'sm',
        radius: 'lg',
        withBorder: true,
      },
      styles: {
        root: {
          backgroundColor: '#ffffff',
          borderColor: '#f1f5f9',
        },
      },
    },
    Input: {
      defaultProps: {
        radius: 'md',
        size: 'md',
      },
      styles: {
        input: {
          borderColor: '#e2e8f0',
          backgroundColor: '#ffffff',
          transition: 'all 0.15s ease',
          '&:focus': {
            borderColor: '#3b82f6',
            boxShadow: `0 0 0 3px ${rgba('#3b82f6', 0.1)}`,
          },
          '&::placeholder': {
            color: '#94a3b8',
          },
        },
        label: {
          fontWeight: 500,
          color: '#374151',
          marginBottom: rem(4),
        },
      },
    },
    TextInput: {
      styles: {
        input: {
          borderColor: '#e2e8f0',
          backgroundColor: '#ffffff',
          transition: 'all 0.15s ease',
          '&:focus': {
            borderColor: '#3b82f6',
            boxShadow: `0 0 0 3px ${rgba('#3b82f6', 0.1)}`,
          },
        },
      },
    },
    Textarea: {
      styles: {
        input: {
          borderColor: '#e2e8f0',
          backgroundColor: '#ffffff',
          transition: 'all 0.15s ease',
          '&:focus': {
            borderColor: '#3b82f6',
            boxShadow: `0 0 0 3px ${rgba('#3b82f6', 0.1)}`,
          },
        },
      },
    },
    Select: {
      styles: {
        input: {
          borderColor: '#e2e8f0',
          backgroundColor: '#ffffff',
          transition: 'all 0.15s ease',
          '&:focus': {
            borderColor: '#3b82f6',
            boxShadow: `0 0 0 3px ${rgba('#3b82f6', 0.1)}`,
          },
        },
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        shadow: 'xl',
        padding: 'xl',
      },
      styles: {
        content: {
          backgroundColor: '#ffffff',
        },
        header: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #f1f5f9',
          marginBottom: rem(16),
        },
        title: {
          fontWeight: 600,
          fontSize: rem(20),
          color: '#111827',
        },
      },
    },
    Table: {
      styles: {
        table: {
          backgroundColor: '#ffffff',
        },
        th: {
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          color: '#374151',
          fontWeight: 600,
          fontSize: rem(14),
          padding: `${rem(12)} ${rem(16)}`,
        },
        td: {
          borderBottom: '1px solid #f1f5f9',
          padding: `${rem(12)} ${rem(16)}`,
          fontSize: rem(14),
          color: '#374151',
        },
        tr: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    Tabs: {
      styles: {
        tab: {
          fontWeight: 500,
          color: '#6b7280',
          transition: 'all 0.15s ease',
          '&[data-active]': {
            color: '#3b82f6',
            borderColor: '#3b82f6',
          },
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    Badge: {
      styles: {
        root: {
          fontWeight: 500,
          fontSize: rem(12),
        },
      },
    },
    Notification: {
      styles: {
        root: {
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        },
      },
    },
    NavLink: {
      styles: {
        root: {
          borderRadius: rem(8),
          margin: `${rem(2)} 0`,
          transition: 'all 0.15s ease',
          '&[data-active]': {
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            fontWeight: 500,
          },
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
  },
});

// Dark theme
export const darkTheme = createTheme({
  ...commonTheme,
  white: '#000000',
  black: '#ffffff',
  colors: {
    ...commonTheme.colors,
    dark: [
      '#C1C2C5',
      '#A6A7AB', 
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262b',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        size: 'md',
      },
      styles: {
        root: {
          fontWeight: 500,
          transition: 'all 0.15s ease',
          border: 'none',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      },
      variants: {
        primary: (theme) => ({
          root: {
            backgroundColor: theme.colors.brand[5],
            color: theme.colors.dark[9],
            '&:hover': {
              backgroundColor: theme.colors.brand[4],
            },
          },
        }),
        secondary: (theme) => ({
          root: {
            backgroundColor: theme.colors.dark[6],
            color: theme.colors.dark[0],
            border: `1px solid ${theme.colors.dark[5]}`,
            '&:hover': {
              backgroundColor: theme.colors.dark[5],
            },
          },
        }),
        ghost: (theme) => ({
          root: {
            backgroundColor: 'transparent',
            color: theme.colors.dark[2],
            '&:hover': {
              backgroundColor: theme.colors.dark[7],
            },
          },
        }),
      },
    },
    Card: {
      defaultProps: {
        shadow: 'sm',
        radius: 'lg',
        withBorder: true,
        padding: 'lg',
      },
      styles: {
        root: {
          backgroundColor: '#1A1B1E',
          borderColor: '#373A40',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    Paper: {
      defaultProps: {
        shadow: 'sm',
        radius: 'lg',
        withBorder: true,
      },
      styles: {
        root: {
          backgroundColor: '#1A1B1E',
          borderColor: '#373A40',
        },
      },
    },
    Input: {
      defaultProps: {
        radius: 'md',
        size: 'md',
      },
      styles: {
        input: {
          borderColor: '#373A40',
          backgroundColor: '#25262b',
          color: '#C1C2C5',
          transition: 'all 0.15s ease',
          '&:focus': {
            borderColor: '#60a5fa',
            boxShadow: `0 0 0 3px ${rgba('#60a5fa', 0.2)}`,
          },
          '&::placeholder': {
            color: '#5c5f66',
          },
        },
        label: {
          fontWeight: 500,
          color: '#C1C2C5',
          marginBottom: rem(4),
        },
      },
    },
    TextInput: {
      styles: {
        input: {
          borderColor: '#373A40',
          backgroundColor: '#25262b',
          color: '#C1C2C5',
          transition: 'all 0.15s ease',
          '&:focus': {
            borderColor: '#60a5fa',
            boxShadow: `0 0 0 3px ${rgba('#60a5fa', 0.2)}`,
          },
        },
      },
    },
    Textarea: {
      styles: {
        input: {
          borderColor: '#373A40',
          backgroundColor: '#25262b',
          color: '#C1C2C5',
          transition: 'all 0.15s ease',
          '&:focus': {
            borderColor: '#60a5fa',
            boxShadow: `0 0 0 3px ${rgba('#60a5fa', 0.2)}`,
          },
        },
      },
    },
    Select: {
      styles: {
        input: {
          borderColor: '#373A40',
          backgroundColor: '#25262b',
          color: '#C1C2C5',
          transition: 'all 0.15s ease',
          '&:focus': {
            borderColor: '#60a5fa',
            boxShadow: `0 0 0 3px ${rgba('#60a5fa', 0.2)}`,
          },
        },
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        shadow: 'xl',
        padding: 'xl',
      },
      styles: {
        content: {
          backgroundColor: '#1A1B1E',
        },
        header: {
          backgroundColor: '#1A1B1E',
          borderBottom: '1px solid #373A40',
          marginBottom: rem(16),
        },
        title: {
          fontWeight: 600,
          fontSize: rem(20),
          color: '#C1C2C5',
        },
      },
    },
    Table: {
      styles: {
        table: {
          backgroundColor: '#1A1B1E',
        },
        th: {
          backgroundColor: '#25262b',
          borderBottom: '1px solid #373A40',
          color: '#C1C2C5',
          fontWeight: 600,
          fontSize: rem(14),
          padding: `${rem(12)} ${rem(16)}`,
        },
        td: {
          borderBottom: '1px solid #373A40',
          padding: `${rem(12)} ${rem(16)}`,
          fontSize: rem(14),
          color: '#A6A7AB',
        },
        tr: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: '#25262b',
          },
        },
      },
    },
    Tabs: {
      styles: {
        tab: {
          fontWeight: 500,
          color: '#5c5f66',
          transition: 'all 0.15s ease',
          '&[data-active]': {
            color: '#60a5fa',
            borderColor: '#60a5fa',
          },
          '&:hover': {
            backgroundColor: '#25262b',
          },
        },
      },
    },
    Badge: {
      styles: {
        root: {
          fontWeight: 500,
          fontSize: rem(12),
        },
      },
    },
    Notification: {
      styles: {
        root: {
          backgroundColor: '#1A1B1E',
          border: '1px solid #373A40',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
        },
      },
    },
    NavLink: {
      styles: {
        root: {
          borderRadius: rem(8),
          margin: `${rem(2)} 0`,
          transition: 'all 0.15s ease',
          '&[data-active]': {
            backgroundColor: '#2C2E33',
            color: '#60a5fa',
            fontWeight: 500,
          },
          '&:hover': {
            backgroundColor: '#25262b',
          },
        },
      },
    },
  },
});