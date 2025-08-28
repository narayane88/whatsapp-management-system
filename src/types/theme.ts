import { designSystem, mantineColors } from '@/styles/design-system'

export interface CustomTheme {
  id: string
  name: string
  description: string
  primaryColor: string
  colors?: Record<string, string[]>
  components?: {
    Button?: Record<string, unknown>
    Card?: Record<string, unknown>
    Badge?: Record<string, unknown>
    TextInput?: Record<string, unknown>
    Table?: Record<string, unknown>
  }
  other?: {
    colorScheme?: 'light' | 'dark'
  }
}

export const predefinedThemes: CustomTheme[] = [
  {
    id: 'whatsapp-default',
    name: 'WhatsApp Default',
    description: 'Official WhatsApp brand theme with green accents',
    primaryColor: 'whatsapp',
    colors: {
      whatsapp: mantineColors.whatsapp as unknown as string[],
      success: mantineColors.success as unknown as string[],
      warning: mantineColors.warning as unknown as string[],
      error: mantineColors.error as unknown as string[]
    },
    components: {
      Button: {
        styles: {
          root: {
            borderRadius: designSystem.borderRadius.lg,
            fontWeight: designSystem.typography.weights.medium,
            transition: designSystem.transitions.normal
          }
        }
      },
      Card: {
        styles: {
          root: {
            borderRadius: designSystem.borderRadius.xl,
            boxShadow: designSystem.shadows.sm,
            border: `1px solid ${designSystem.colors.neutral[200]}`
          }
        }
      },
      TextInput: {
        styles: {
          input: {
            borderRadius: designSystem.borderRadius.lg,
            borderColor: designSystem.colors.neutral[300],
            fontSize: designSystem.typography.sizes.md
          }
        }
      }
    },
    other: {
      colorScheme: 'light'
    }
  },
  {
    id: 'business-professional',
    name: 'Business Professional',
    description: 'Professional corporate theme optimized for business use',
    primaryColor: 'business',
    colors: {
      business: mantineColors.business,
      success: mantineColors.success,
      warning: mantineColors.warning,
      error: mantineColors.error
    },
    components: {
      Button: {
        styles: {
          root: {
            borderRadius: designSystem.borderRadius.md,
            fontWeight: designSystem.typography.weights.semibold,
            textTransform: 'none'
          }
        }
      },
      Card: {
        styles: {
          root: {
            borderRadius: designSystem.borderRadius.lg,
            boxShadow: designSystem.shadows.md,
            border: 'none'
          }
        }
      }
    },
    other: {
      colorScheme: 'light'
    }
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    description: 'Modern dark theme for reduced eye strain',
    primaryColor: 'whatsapp',
    colors: {
      whatsapp: mantineColors.whatsapp as unknown as string[],
      success: mantineColors.success as unknown as string[],
      warning: mantineColors.warning as unknown as string[],
      error: mantineColors.error as unknown as string[]
    },
    components: {
      Button: {
        styles: {
          root: {
            borderRadius: designSystem.borderRadius.lg,
            fontWeight: designSystem.typography.weights.medium
          }
        }
      },
      Card: {
        styles: {
          root: {
            borderRadius: designSystem.borderRadius.xl,
            boxShadow: designSystem.shadows.lg,
            backgroundColor: '#1F2937',
            borderColor: '#374151'
          }
        }
      }
    },
    other: {
      colorScheme: 'dark'
    }
  },
  {
    id: 'emerald-fresh',
    name: 'Emerald Fresh',
    description: 'Fresh and vibrant green theme for nature-inspired interfaces',
    primaryColor: 'success',
    colors: {
      success: mantineColors.success,
      whatsapp: mantineColors.whatsapp,
      warning: mantineColors.warning,
      error: mantineColors.error
    },
    components: {
      Button: {
        styles: {
          root: {
            borderRadius: designSystem.borderRadius.lg,
            fontWeight: designSystem.typography.weights.medium
          }
        }
      }
    },
    other: {
      colorScheme: 'light'
    }
  },
  {
    id: 'sunset-warm',
    name: 'Sunset Warm',
    description: 'Warm and energetic orange theme for creative workflows',
    primaryColor: 'warning',
    colors: {
      warning: mantineColors.warning,
      whatsapp: mantineColors.whatsapp,
      success: mantineColors.success,
      error: mantineColors.error
    },
    other: {
      colorScheme: 'light'
    }
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Ultra-clean minimal design with subtle accents',
    primaryColor: 'business',
    colors: {
      business: mantineColors.business,
      success: mantineColors.success,
      warning: mantineColors.warning,
      error: mantineColors.error
    },
    components: {
      Button: {
        styles: {
          root: {
            borderRadius: designSystem.borderRadius.sm,
            fontWeight: designSystem.typography.weights.normal,
            boxShadow: 'none'
          }
        }
      },
      Card: {
        styles: {
          root: {
            borderRadius: designSystem.borderRadius.md,
            boxShadow: 'none',
            border: `1px solid ${designSystem.colors.neutral[200]}`
          }
        }
      }
    },
    other: {
      colorScheme: 'light'
    }
  }
]