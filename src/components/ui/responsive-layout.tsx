import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Stack,
  Group,
  Burger,
  Drawer,
  rem,
  useMantineTheme,
} from '@mantine/core';
import { useMediaQuery, useDisclosure } from '@mantine/hooks';

// Responsive Container Component
export const ResponsiveContainer = ({ 
  children, 
  size = 'lg',
  fluid = false,
  px = 'md',
  ...props 
}: any) => {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  
  return (
    <Container
      size={fluid ? '100%' : size}
      px={isMobile ? 'sm' : px}
      styles={{
        root: {
          maxWidth: fluid ? '100%' : 
                   size === 'xs' ? rem(576) : 
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

// Responsive Grid Component
export const ResponsiveGrid = ({ children, ...props }: any) => {
  return (
    <Grid gutter={{ base: 'md', sm: 'lg', lg: 'xl' }} {...props}>
      {children}
    </Grid>
  );
};

// Responsive Stack Component
export const ResponsiveStack = ({ 
  children, 
  spacing = { base: 'md', sm: 'lg' },
  ...props 
}: any) => {
  return (
    <Stack gap={spacing} {...props}>
      {children}
    </Stack>
  );
};

// Responsive Sidebar Layout
export const ResponsiveSidebarLayout = ({ 
  sidebar, 
  children, 
  sidebarWidth = 280,
  header,
  ...props 
}: any) => {
  const theme = useMantineTheme();
  const [opened, { toggle, close }] = useDisclosure(false);
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  
  return (
    <Box style={{ display: 'flex', minHeight: '100vh' }} {...props}>
      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          opened={opened}
          onClose={close}
          size={sidebarWidth}
          padding={0}
          styles={{
            content: {
              backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
            },
          }}
        >
          {sidebar}
        </Drawer>
      )}
      
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Box
          style={{
            width: rem(sidebarWidth),
            flexShrink: 0,
            borderRight: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
          }}
        >
          {sidebar}
        </Box>
      )}
      
      {/* Main Content Area */}
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header with Mobile Burger */}
        {header && (
          <Box
            style={{
              borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
              backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
              padding: `0 ${rem(16)}`,
              display: 'flex',
              alignItems: 'center',
              minHeight: rem(64),
            }}
          >
            {isMobile && (
              <Burger
                opened={opened}
                onClick={toggle}
                size="sm"
                mr="md"
                style={{
                  color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7],
                }}
              />
            )}
            <Box style={{ flex: 1 }}>
              {header}
            </Box>
          </Box>
        )}
        
        {/* Main Content */}
        <Box style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

// Responsive Card Grid
export const ResponsiveCardGrid = ({ 
  children, 
  minCardWidth = 300,
  gap = 'md',
  ...props 
}: any) => {
  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${rem(minCardWidth)}, 1fr))`,
        gap: rem(typeof gap === 'string' ? 16 : gap),
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

// Responsive Two Column Layout
export const ResponsiveTwoColumn = ({ 
  left, 
  right, 
  leftSpan = 8, 
  rightSpan = 4,
  stackOnMobile = true,
  ...props 
}: any) => {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  
  if (isMobile && stackOnMobile) {
    return (
      <Stack gap="lg" {...props}>
        <Box>{left}</Box>
        <Box>{right}</Box>
      </Stack>
    );
  }
  
  return (
    <Grid {...props}>
      <Grid.Col span={{ base: 12, md: leftSpan }}>
        {left}
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: rightSpan }}>
        {right}
      </Grid.Col>
    </Grid>
  );
};

// Responsive Three Column Layout
export const ResponsiveThreeColumn = ({ 
  left, 
  center, 
  right, 
  leftSpan = 3, 
  centerSpan = 6, 
  rightSpan = 3,
  ...props 
}: any) => {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  const isTablet = useMediaQuery(`(max-width: ${theme.breakpoints.lg})`);
  
  if (isMobile) {
    return (
      <Stack gap="lg" {...props}>
        <Box>{left}</Box>
        <Box>{center}</Box>
        <Box>{right}</Box>
      </Stack>
    );
  }
  
  if (isTablet) {
    return (
      <Grid {...props}>
        <Grid.Col span={12}>
          {center}
        </Grid.Col>
        <Grid.Col span={6}>
          {left}
        </Grid.Col>
        <Grid.Col span={6}>
          {right}
        </Grid.Col>
      </Grid>
    );
  }
  
  return (
    <Grid {...props}>
      <Grid.Col span={leftSpan}>
        {left}
      </Grid.Col>
      <Grid.Col span={centerSpan}>
        {center}
      </Grid.Col>
      <Grid.Col span={rightSpan}>
        {right}
      </Grid.Col>
    </Grid>
  );
};

// Responsive Modal
export const ResponsiveModal = ({ 
  children, 
  size = 'md',
  fullScreen = false,
  ...props 
}: any) => {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  
  const modalSize = isMobile ? '100%' : size;
  const shouldBeFullScreen = isMobile || fullScreen;
  
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
        alignItems: shouldBeFullScreen ? 'stretch' : 'center',
        justifyContent: shouldBeFullScreen ? 'stretch' : 'center',
        padding: shouldBeFullScreen ? 0 : rem(16),
      }}
      {...props}
    >
      <Box
        style={{
          width: shouldBeFullScreen ? '100%' : modalSize === 'xs' ? rem(320) :
                modalSize === 'sm' ? rem(380) :
                modalSize === 'md' ? rem(440) :
                modalSize === 'lg' ? rem(620) :
                modalSize === 'xl' ? rem(780) : modalSize,
          height: shouldBeFullScreen ? '100%' : 'auto',
          maxHeight: shouldBeFullScreen ? '100%' : '90vh',
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
          borderRadius: shouldBeFullScreen ? 0 : rem(12),
          overflow: 'auto',
          boxShadow: theme.shadows.xl,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

// Responsive Table Container
export const ResponsiveTableContainer = ({ children, ...props }: any) => {
  return (
    <Box
      style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      {...props}
    >
      <Box style={{ minWidth: rem(600) }}>
        {children}
      </Box>
    </Box>
  );
};

// Responsive Text Size Hook
export const useResponsiveTextSize = () => {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const isTablet = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  
  if (isMobile) {
    return {
      h1: 'xl',
      h2: 'lg',
      h3: 'md',
      body: 'sm',
      caption: 'xs',
    };
  }
  
  if (isTablet) {
    return {
      h1: '2xl',
      h2: 'xl',
      h3: 'lg',
      body: 'md',
      caption: 'sm',
    };
  }
  
  return {
    h1: '3xl',
    h2: '2xl',
    h3: 'xl',
    body: 'md',
    caption: 'sm',
  };
};

// Responsive Spacing Hook
export const useResponsiveSpacing = () => {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const isTablet = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  
  if (isMobile) {
    return {
      xs: 'xs',
      sm: 'sm',
      md: 'md',
      lg: 'md',
      xl: 'lg',
    };
  }
  
  if (isTablet) {
    return {
      xs: 'xs',
      sm: 'sm',
      md: 'md',
      lg: 'lg',
      xl: 'lg',
    };
  }
  
  return {
    xs: 'xs',
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl',
  };
};

// Media Query Components for conditional rendering
export const ShowOnMobile = ({ children }: any) => {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  
  return isMobile ? children : null;
};

export const HideOnMobile = ({ children }: any) => {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  
  return !isMobile ? children : null;
};

export const ShowOnTablet = ({ children }: any) => {
  const theme = useMantineTheme();
  const isTablet = useMediaQuery(`(min-width: ${theme.breakpoints.sm}) and (max-width: ${theme.breakpoints.lg})`);
  
  return isTablet ? children : null;
};

export const ShowOnDesktop = ({ children }: any) => {
  const theme = useMantineTheme();
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.lg})`);
  
  return isDesktop ? children : null;
};

