/**
 * MetricCard - Unified Metric Display Component
 * 
 * This component provides consistent metric and KPI display across dashboards
 * with trend indicators, icons, and loading states.
 */

'use client'

import { forwardRef } from 'react'
import { Card, Group, Text, Stack, Loader, rem } from '@mantine/core'
import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react'
import { designSystem } from '@/styles/design-system'
import { MetricCardProps } from './types'

const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  ({
    title,
    value,
    subtitle,
    trend,
    icon,
    color = 'neutral',
    size = 'md',
    loading = false,
    className,
    style,
    'data-testid': testId,
    ...props
  }, ref) => {
    
    // Size configurations
    const sizeConfig = {
      xs: {
        padding: designSystem.spacing.sm,
        titleSize: 'xs',
        valueSize: 'lg',
        subtitleSize: 'xs',
        iconSize: rem(16)
      },
      sm: {
        padding: designSystem.spacing.md,
        titleSize: 'sm',
        valueSize: 'xl',
        subtitleSize: 'xs',
        iconSize: rem(18)
      },
      md: {
        padding: designSystem.spacing.lg,
        titleSize: 'sm',
        valueSize: 'xxl',
        subtitleSize: 'sm',
        iconSize: rem(20)
      },
      lg: {
        padding: designSystem.spacing.xl,
        titleSize: 'md',
        valueSize: 'xxxl',
        subtitleSize: 'sm',
        iconSize: rem(24)
      },
      xl: {
        padding: designSystem.spacing.xxl,
        titleSize: 'lg',
        valueSize: 'xxxl',
        subtitleSize: 'md',
        iconSize: rem(28)
      }
    }
    
    // Color configurations
    const getColorConfig = () => {
      switch (color) {
        case 'whatsapp':
          return {
            iconColor: designSystem.colors.whatsapp.primary,
            iconBg: designSystem.colors.whatsapp.light,
            borderColor: designSystem.colors.whatsapp.primary
          }
        case 'business':
          return {
            iconColor: designSystem.colors.business.primary,
            iconBg: designSystem.colors.business.light,
            borderColor: designSystem.colors.business.primary
          }
        case 'success':
          return {
            iconColor: designSystem.colors.success[600],
            iconBg: designSystem.colors.success[50],
            borderColor: designSystem.colors.success[200]
          }
        case 'warning':
          return {
            iconColor: designSystem.colors.warning[600],
            iconBg: designSystem.colors.warning[50],
            borderColor: designSystem.colors.warning[200]
          }
        case 'error':
          return {
            iconColor: designSystem.colors.error[600],
            iconBg: designSystem.colors.error[50],
            borderColor: designSystem.colors.error[200]
          }
        case 'neutral':
        default:
          return {
            iconColor: designSystem.colors.neutral[600],
            iconBg: designSystem.colors.neutral[100],
            borderColor: designSystem.colors.neutral[200]
          }
      }
    }
    
    const currentSizeConfig = sizeConfig[size]
    const colorConfig = getColorConfig()
    
    // Format value for display
    const formatValue = (val: string | number): string => {
      if (typeof val === 'number') {
        // Format large numbers with commas
        if (val >= 1000000) {
          return `${(val / 1000000).toFixed(1)}M`
        } else if (val >= 1000) {
          return `${(val / 1000).toFixed(1)}K`
        }
        return val.toLocaleString()
      }
      return String(val)
    }
    
    // Render trend indicator
    const renderTrend = () => {
      if (!trend) return null
      
      const isPositive = trend.isPositive
      const TrendIcon = isPositive 
        ? IconTrendingUp 
        : trend.value === 0 
          ? IconMinus 
          : IconTrendingDown
      
      const trendColor = isPositive 
        ? designSystem.colors.success[600]
        : trend.value === 0
          ? designSystem.colors.neutral[500]
          : designSystem.colors.error[600]
      
      return (
        <Group gap={4} align="center">
          <TrendIcon 
            size={rem(14)} 
            color={trendColor}
            stroke={1.5}
          />
          <Text 
            size="xs" 
            c={trendColor}
            fw={designSystem.typography.weights.medium}
          >
            {Math.abs(trend.value)}%
          </Text>
          {trend.label && (
            <Text 
              size="xs" 
              c={designSystem.colors.neutral[500]}
            >
              {trend.label}
            </Text>
          )}
        </Group>
      )
    }
    
    // Render icon with background
    const renderIcon = () => {
      if (!icon) return null
      
      return (
        <div
          style={{
            width: rem(40),
            height: rem(40),
            borderRadius: designSystem.borderRadius.lg,
            backgroundColor: colorConfig.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colorConfig.iconColor
          }}
        >
          {icon}
        </div>
      )
    }
    
    if (loading) {
      return (
        <Card
          ref={ref}
          className={className}
          data-testid={testId}
          p={currentSizeConfig.padding}
          radius={designSystem.borderRadius.xl}
          withBorder
          styles={{
            root: {
              borderColor: designSystem.colors.neutral[200],
              backgroundColor: '#ffffff',
              minHeight: rem(120),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...style
            }
          }}
          {...props}
        >
          <Stack align="center" gap="xs">
            <Loader size="sm" color={colorConfig.iconColor} />
            <Text size="sm" c={designSystem.colors.neutral[500]}>
              Loading...
            </Text>
          </Stack>
        </Card>
      )
    }
    
    return (
      <Card
        ref={ref}
        className={className}
        data-testid={testId}
        p={currentSizeConfig.padding}
        radius={designSystem.borderRadius.xl}
        withBorder
        styles={{
          root: {
            borderColor: designSystem.colors.neutral[200],
            backgroundColor: '#ffffff',
            transition: designSystem.transitions.normal,
            fontFamily: designSystem.typography.fonts.primary,
            
            '&:hover': {
              borderColor: colorConfig.borderColor,
              boxShadow: designSystem.shadows.md
            },
            
            ...style
          }
        }}
        {...props}
      >
        <Stack gap="sm">
          {/* Header with icon and title */}
          <Group justify="space-between" align="flex-start">
            <div style={{ flex: 1 }}>
              <Text 
                size={currentSizeConfig.titleSize}
                c={designSystem.colors.neutral[600]}
                fw={designSystem.typography.weights.medium}
                mb={4}
              >
                {title}
              </Text>
            </div>
            {renderIcon()}
          </Group>
          
          {/* Main value */}
          <Text 
            size={currentSizeConfig.valueSize}
            fw={designSystem.typography.weights.bold}
            c={designSystem.colors.neutral[900]}
            lh={1.2}
          >
            {formatValue(value)}
          </Text>
          
          {/* Subtitle and trend */}
          <Group justify="space-between" align="center">
            {subtitle && (
              <Text 
                size={currentSizeConfig.subtitleSize}
                c={designSystem.colors.neutral[500]}
                fw={designSystem.typography.weights.normal}
              >
                {subtitle}
              </Text>
            )}
            {renderTrend()}
          </Group>
        </Stack>
      </Card>
    )
  }
)

MetricCard.displayName = 'MetricCard'

export default MetricCard