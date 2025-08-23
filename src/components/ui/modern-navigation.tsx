import React, { useState } from 'react';
import {
  Box,
  Group,
  Stack,
  Text,
  UnstyledButton,
  NavLink,
  Tabs,
  Menu,
  ActionIcon,
  Avatar,
  Indicator,
  Tooltip,
  Divider,
  Collapse,
  rem,
  useMantineTheme,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronRight,
  IconBell,
  IconSettings,
  IconUser,
  IconLogout,
  IconMoon,
  IconSun,
  IconSearch,
  IconPlus,
  IconDots,
} from '@tabler/icons-react';

// Modern Navigation Link Component
export const ModernNavLink = ({ 
  icon: Icon, 
  label, 
  active = false, 
  children, 
  hasNotification = false,
  onClick,
  ...props 
}: any) => {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  
  return (
    <Box>
      <UnstyledButton
        onClick={() => {
          if (children) {
            setOpened(!opened);
          }
          onClick?.();
        }}
        styles={{
          root: {
            display: 'block',
            width: '100%',
            padding: `${rem(8)} ${rem(12)}`,
            borderRadius: rem(8),
            color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7],
            backgroundColor: active 
              ? (theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.blue[0])
              : 'transparent',
            transition: 'all 0.15s ease',
            marginBottom: rem(2),
            fontWeight: active ? 500 : 400,
            
            '&:hover': {
              backgroundColor: theme.colorScheme === 'dark' 
                ? theme.colors.dark[6] 
                : theme.colors.gray[0],
            },
          },
        }}
        {...props}
      >
        <Group justify="space-between">
          <Group gap={12}>
            {Icon && (
              <Box style={{ position: 'relative' }}>
                <Icon 
                  size={18} 
                  color={active 
                    ? (theme.colorScheme === 'dark' ? theme.colors.blue[4] : theme.colors.blue[6])
                    : (theme.colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6])
                  }
                />
                {hasNotification && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                    }}
                  />
                )}
              </Box>
            )}
            <Text 
              size="sm" 
              color={active 
                ? (theme.colorScheme === 'dark' ? theme.colors.blue[4] : theme.colors.blue[6])
                : (theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7])
              }
            >
              {label}
            </Text>
          </Group>
          {children && (
            <IconChevronDown
              size={14}
              style={{
                transform: opened ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          )}
        </Group>
      </UnstyledButton>
      
      {children && (
        <Collapse in={opened}>
          <Box pl={30} pt={4}>
            {children}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

// Modern Sidebar Component
export const ModernSidebar = ({ 
  children, 
  header, 
  footer, 
  width = 280,
  ...props 
}: any) => {
  const theme = useMantineTheme();
  
  return (
    <Box
      style={{
        width: rem(width),
        height: '100vh',
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        borderRight: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
        display: 'flex',
        flexDirection: 'column',
      }}
      {...props}
    >
      {header && (
        <Box
          p="md"
          style={{
            borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
          }}
        >
          {header}
        </Box>
      )}
      
      <Box style={{ flex: 1, overflow: 'auto' }} p="md">
        <Stack gap={4}>
          {children}
        </Stack>
      </Box>
      
      {footer && (
        <Box
          p="md"
          style={{
            borderTop: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
          }}
        >
          {footer}
        </Box>
      )}
    </Box>
  );
};

// Modern Header Component
export const ModernHeader = ({ 
  title, 
  actions, 
  breadcrumbs,
  searchValue,
  onSearchChange,
  userMenuData,
  ...props 
}: any) => {
  const theme = useMantineTheme();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  
  return (
    <Box
      style={{
        height: rem(64),
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${rem(24)}`,
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
      {...props}
    >
      <Group>
        {breadcrumbs ? (
          <Box>
            {breadcrumbs}
          </Box>
        ) : (
          <Text size="lg" fw={600}>
            {title}
          </Text>
        )}
      </Group>
      
      <Group gap={12}>
        {/* Search */}
        {onSearchChange && (
          <Box style={{ position: 'relative' }}>
            <IconSearch
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.colorScheme === 'dark' ? theme.colors.dark[3] : theme.colors.gray[5],
              }}
            />
            <input
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                paddingLeft: rem(36),
                paddingRight: rem(12),
                height: rem(36),
                border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}`,
                borderRadius: rem(8),
                backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[9],
                outline: 'none',
                transition: 'all 0.15s ease',
                width: rem(200),
              }}
            />
          </Box>
        )}
        
        {/* Actions */}
        {actions}
        
        {/* Theme Toggle */}
        <Tooltip label={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`}>
          <ActionIcon
            variant="subtle"
            size="lg"
            radius="md"
            onClick={() => toggleColorScheme()}
            style={{
              transition: 'all 0.15s ease',
            }}
          >
            {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>
        </Tooltip>
        
        {/* Notifications */}
        <Tooltip label="Notifications">
          <Indicator
            inline
            size={8}
            offset={4}
            position="top-end"
            color="red"
            disabled={!userMenuData?.hasNotifications}
          >
            <ActionIcon variant="subtle" size="lg" radius="md">
              <IconBell size={18} />
            </ActionIcon>
          </Indicator>
        </Tooltip>
        
        {/* User Menu */}
        {userMenuData && (
          <Menu position="bottom-end" shadow="lg" radius="md">
            <Menu.Target>
              <UnstyledButton
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: rem(8),
                  padding: rem(8),
                  borderRadius: rem(8),
                  transition: 'background-color 0.15s ease',
                  
                  '&:hover': {
                    backgroundColor: theme.colorScheme === 'dark' 
                      ? theme.colors.dark[6] 
                      : theme.colors.gray[0],
                  },
                }}
              >
                <Avatar
                  src={userMenuData.avatar}
                  size={32}
                  radius="xl"
                  style={{
                    border: `2px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
                  }}
                />
                <Box style={{ textAlign: 'left' }}>
                  <Text size="sm" fw={500}>
                    {userMenuData.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {userMenuData.role}
                  </Text>
                </Box>
                <IconChevronDown size={14} />
              </UnstyledButton>
            </Menu.Target>
            
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconUser size={16} />}>
                Profile
              </Menu.Item>
              <Menu.Item leftSection={<IconSettings size={16} />}>
                Settings
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item 
                leftSection={<IconLogout size={16} />}
                color="red"
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Box>
  );
};

// Modern Tabs Component
export const ModernTabs = ({ children, value, onChange, ...props }: any) => {
  const theme = useMantineTheme();
  
  return (
    <Tabs
      value={value}
      onChange={onChange}
      styles={{
        tab: {
          padding: `${rem(12)} ${rem(20)}`,
          fontWeight: 500,
          fontSize: rem(14),
          color: theme.colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6],
          transition: 'all 0.15s ease',
          borderRadius: `${rem(8)} ${rem(8)} 0 0`,
          border: 'none',
          backgroundColor: 'transparent',
          
          '&[data-active]': {
            color: theme.colorScheme === 'dark' ? theme.colors.blue[4] : theme.colors.blue[6],
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.blue[0],
            borderBottom: `2px solid ${theme.colorScheme === 'dark' ? theme.colors.blue[4] : theme.colors.blue[6]}`,
          },
          
          '&:hover:not([data-active])': {
            backgroundColor: theme.colorScheme === 'dark' 
              ? theme.colors.dark[6] 
              : theme.colors.gray[0],
          },
        },
        tabsList: {
          borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
        },
        panel: {
          paddingTop: rem(20),
        },
      }}
      {...props}
    >
      {children}
    </Tabs>
  );
};

// Modern Breadcrumbs Component
export const ModernBreadcrumbs = ({ items, ...props }: any) => {
  const theme = useMantineTheme();
  
  return (
    <Group gap={8} {...props}>
      {items?.map((item: any, index: number) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <IconChevronRight 
              size={14} 
              color={theme.colorScheme === 'dark' ? theme.colors.dark[3] : theme.colors.gray[5]}
            />
          )}
          <UnstyledButton
            onClick={item.onClick}
            disabled={!item.onClick}
            styles={{
              root: {
                color: index === items.length - 1
                  ? (theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[9])
                  : (theme.colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6]),
                fontSize: rem(14),
                fontWeight: index === items.length - 1 ? 500 : 400,
                textDecoration: 'none',
                transition: 'color 0.15s ease',
                
                '&:hover:not(:disabled)': {
                  color: theme.colorScheme === 'dark' ? theme.colors.blue[4] : theme.colors.blue[6],
                },
              },
            }}
          >
            {item.label}
          </UnstyledButton>
        </React.Fragment>
      ))}
    </Group>
  );
};

// Export all navigation components
export {
  ModernNavLink as NavLink,
  ModernSidebar as Sidebar,
  ModernHeader as Header,
  ModernTabs as Tabs,
  ModernBreadcrumbs as Breadcrumbs,
};