import React from 'react';
import {
  Button,
  Card,
  TextInput,
  Textarea,
  Select,
  Modal,
  Badge,
  Table,
  Tabs,
  ActionIcon,
  Group,
  Stack,
  Text,
  Title,
  Container,
  Paper,
  Notification,
  NavLink,
  Loader,
  Progress,
  Alert,
  Tooltip,
  Menu,
  Divider,
  Avatar,
  Box,
  rem,
  MantineTheme,
  useMantineTheme,
} from '@mantine/core';
import {
  IconBell,
  IconSettings,
  IconUser,
  IconChevronDown,
  IconCheck,
  IconX,
  IconInfoCircle,
  IconAlertTriangle,
} from '@tabler/icons-react';

// Modern Button Variants
export const ModernButton = React.forwardRef<HTMLButtonElement, any>(
  ({ variant = 'primary', children, ...props }, ref) => {
    const theme = useMantineTheme();
    
    const variants = {
      primary: {
        bg: theme.colors.blue[6],
        color: theme.white,
        hover: theme.colors.blue[7],
      },
      secondary: {
        bg: theme.colors.gray[1],
        color: theme.colors.gray[9],
        hover: theme.colors.gray[2],
        border: `1px solid ${theme.colors.gray[3]}`,
      },
      ghost: {
        bg: 'transparent',
        color: theme.colors.gray[7],
        hover: theme.colors.gray[1],
      },
      success: {
        bg: theme.colors.green[6],
        color: theme.white,
        hover: theme.colors.green[7],
      },
      danger: {
        bg: '#ef4444',
        color: theme.white,
        hover: '#dc2626',
      },
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        styles={{
          root: {
            fontWeight: 500,
            transition: 'all 0.15s ease',
            border: 'none',
            borderRadius: rem(8),
            ...variants[variant as keyof typeof variants],
            '&:hover': {
              transform: 'translateY(-1px)',
              backgroundColor: variants[variant as keyof typeof variants]?.hover,
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
        }}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

// Modern Card Component
export const ModernCard = ({ children, interactive = false, ...props }: any) => {
  const theme = useMantineTheme();
  
  return (
    <Card
      shadow="sm"
      radius="lg"
      withBorder
      padding="lg"
      styles={{
        root: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
          borderColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : '#f1f5f9',
          transition: 'all 0.2s ease',
          cursor: interactive ? 'pointer' : 'default',
          ...(interactive && {
            '&:hover': {
              boxShadow: theme.colorScheme === 'dark' 
                ? '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)'
                : '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              transform: 'translateY(-2px)',
            },
          }),
        },
      }}
      {...props}
    >
      {children}
    </Card>
  );
};

// Modern Input Component
export const ModernTextInput = React.forwardRef<HTMLInputElement, any>(
  ({ label, error, ...props }, ref) => {
    const theme = useMantineTheme();
    
    return (
      <TextInput
        ref={ref}
        label={label}
        error={error}
        radius="md"
        size="md"
        styles={{
          input: {
            borderColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : '#e2e8f0',
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
            color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[9],
            transition: 'all 0.15s ease',
            '&:focus': {
              borderColor: theme.colors.blue[5],
              boxShadow: `0 0 0 3px ${theme.colorScheme === 'dark' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`,
            },
            '&::placeholder': {
              color: theme.colorScheme === 'dark' ? theme.colors.dark[3] : '#94a3b8',
            },
          },
          label: {
            fontWeight: 500,
            color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : '#374151',
            marginBottom: rem(4),
          },
          error: {
            fontSize: rem(12),
            color: '#ef4444',
            marginTop: rem(4),
          },
        }}
        {...props}
      />
    );
  }
);

// Modern Modal Component
export const ModernModal = ({ title, children, ...props }: any) => {
  const theme = useMantineTheme();
  
  return (
    <Modal
      radius="lg"
      shadow="xl"
      padding="xl"
      styles={{
        content: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        },
        header: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
          borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : '#f1f5f9'}`,
          marginBottom: rem(16),
          paddingBottom: rem(16),
        },
        title: {
          fontWeight: 600,
          fontSize: rem(20),
          color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : '#111827',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
        },
      }}
      title={title}
      {...props}
    >
      {children}
    </Modal>
  );
};

// Modern Table Component
export const ModernTable = ({ data, columns, ...props }: any) => {
  const theme = useMantineTheme();
  
  return (
    <Table
      striped
      highlightOnHover
      styles={{
        table: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        },
        th: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : '#f8fafc',
          borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : '#e2e8f0'}`,
          color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : '#374151',
          fontWeight: 600,
          fontSize: rem(14),
          padding: `${rem(12)} ${rem(16)}`,
        },
        td: {
          borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : '#f1f5f9'}`,
          padding: `${rem(12)} ${rem(16)}`,
          fontSize: rem(14),
          color: theme.colorScheme === 'dark' ? theme.colors.dark[1] : '#374151',
        },
        tr: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : '#f8fafc',
          },
        },
      }}
      {...props}
    >
      <Table.Thead>
        <Table.Tr>
          {columns?.map((column: any, index: number) => (
            <Table.Th key={index}>{column.header}</Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {data?.map((row: any, rowIndex: number) => (
          <Table.Tr key={rowIndex}>
            {columns?.map((column: any, colIndex: number) => (
              <Table.Td key={colIndex}>
                {typeof column.accessor === 'function' 
                  ? column.accessor(row) 
                  : row[column.accessor]}
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};

// Modern Badge Component
export const ModernBadge = ({ variant = 'default', children, ...props }: any) => {
  const theme = useMantineTheme();
  
  const variants = {
    default: {
      bg: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
      color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[8],
    },
    success: {
      bg: theme.colorScheme === 'dark' ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7',
      color: theme.colorScheme === 'dark' ? '#4ade80' : '#166534',
    },
    warning: {
      bg: theme.colorScheme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
      color: theme.colorScheme === 'dark' ? '#fbbf24' : '#92400e',
    },
    danger: {
      bg: theme.colorScheme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
      color: theme.colorScheme === 'dark' ? '#f87171' : '#991b1b',
    },
    info: {
      bg: theme.colorScheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
      color: theme.colorScheme === 'dark' ? '#60a5fa' : '#1e40af',
    },
  };

  return (
    <Badge
      styles={{
        root: {
          fontWeight: 500,
          fontSize: rem(12),
          borderRadius: rem(6),
          ...variants[variant as keyof typeof variants],
        },
      }}
      {...props}
    >
      {children}
    </Badge>
  );
};

// Modern Alert Component
export const ModernAlert = ({ 
  variant = 'info', 
  title, 
  children, 
  withCloseButton = true,
  icon,
  ...props 
}: any) => {
  const theme = useMantineTheme();
  
  const variants = {
    info: {
      bg: theme.colorScheme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
      border: theme.colorScheme === 'dark' ? '#1e40af' : '#2563eb',
      color: theme.colorScheme === 'dark' ? '#60a5fa' : '#1e40af',
      icon: IconInfoCircle,
    },
    blue: {
      bg: theme.colorScheme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
      border: theme.colorScheme === 'dark' ? '#1e40af' : '#2563eb',
      color: theme.colorScheme === 'dark' ? '#60a5fa' : '#1e40af',
      icon: IconInfoCircle,
    },
    success: {
      bg: theme.colorScheme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4',
      border: theme.colorScheme === 'dark' ? '#16a34a' : '#22c55e',
      color: theme.colorScheme === 'dark' ? '#4ade80' : '#166534',
      icon: IconCheck,
    },
    green: {
      bg: theme.colorScheme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4',
      border: theme.colorScheme === 'dark' ? '#16a34a' : '#22c55e',
      color: theme.colorScheme === 'dark' ? '#4ade80' : '#166534',
      icon: IconCheck,
    },
    warning: {
      bg: theme.colorScheme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
      border: theme.colorScheme === 'dark' ? '#d97706' : '#f59e0b',
      color: theme.colorScheme === 'dark' ? '#fbbf24' : '#92400e',
      icon: IconAlertTriangle,
    },
    orange: {
      bg: theme.colorScheme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
      border: theme.colorScheme === 'dark' ? '#d97706' : '#f59e0b',
      color: theme.colorScheme === 'dark' ? '#fbbf24' : '#92400e',
      icon: IconAlertTriangle,
    },
    danger: {
      bg: theme.colorScheme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
      border: theme.colorScheme === 'dark' ? '#dc2626' : '#ef4444',
      color: theme.colorScheme === 'dark' ? '#f87171' : '#991b1b',
      icon: IconX,
    },
    red: {
      bg: theme.colorScheme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
      border: theme.colorScheme === 'dark' ? '#dc2626' : '#ef4444',
      color: theme.colorScheme === 'dark' ? '#f87171' : '#991b1b',
      icon: IconX,
    },
  };

  const config = variants[variant as keyof typeof variants] || variants.info;
  
  return (
    <Alert
      icon={icon || <config.icon size={16} />}
      title={title}
      withCloseButton={withCloseButton}
      styles={{
        root: {
          backgroundColor: config.bg,
          borderLeft: `4px solid ${config.border}`,
          border: 'none',
          borderRadius: rem(8),
        },
        icon: {
          color: config.color,
        },
        title: {
          color: config.color,
          fontWeight: 600,
        },
        message: {
          color: theme.colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[7],
        },
      }}
      {...props}
    >
      {children}
    </Alert>
  );
};

// Modern Progress Component
export const ModernProgress = ({ value, variant = 'primary', ...props }: any) => {
  const theme = useMantineTheme();
  
  const variants = {
    primary: theme.colors.blue[6],
    success: theme.colors.green[6],
    warning: '#f59e0b',
    danger: '#ef4444',
  };

  return (
    <Progress
      value={value}
      radius="xl"
      size="md"
      styles={{
        root: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2],
        },
        bar: {
          backgroundColor: variants[variant as keyof typeof variants],
          transition: 'width 0.3s ease',
        },
      }}
      {...props}
    />
  );
};

// Modern Loader Component
export const ModernLoader = ({ variant = 'primary', size = 'md', ...props }: any) => {
  const theme = useMantineTheme();
  
  const variants = {
    primary: theme.colors.blue[6],
    secondary: theme.colors.gray[6],
    white: theme.white,
  };

  return (
    <Loader
      color={variants[variant as keyof typeof variants]}
      size={size}
      type="dots"
      {...props}
    />
  );
};

// Modern Container Component
export const ModernContainer = ({ children, size = 'lg', ...props }: any) => {
  return (
    <Container
      size={size}
      px="md"
      styles={{
        root: {
          maxWidth: size === 'xs' ? rem(576) : 
                   size === 'sm' ? rem(768) : 
                   size === 'md' ? rem(1024) : 
                   size === 'lg' ? rem(1280) : 
                   size === 'xl' ? rem(1536) : rem(1280),
        },
      }}
      {...props}
    >
      {children}
    </Container>
  );
};

// Export all components
export {
  ModernButton as Button,
  ModernCard as Card,
  ModernTextInput as TextInput,
  ModernModal as Modal,
  ModernTable as Table,
  ModernBadge as Badge,
  ModernAlert as Alert,
  ModernProgress as Progress,
  ModernLoader as Loader,
  ModernContainer as Container,
};