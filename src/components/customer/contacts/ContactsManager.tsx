'use client'

import { useEffect, useState } from 'react'
import { 
  Tabs, 
  Card, 
  Stack
} from '@mantine/core'
import { 
  IconUserPlus, 
  IconUsers, 
  IconBell
} from '@tabler/icons-react'
import ContactsList from './ContactsList'
import ContactGroups from './ContactGroups'
import SubscriptionManager from './SubscriptionManager'

interface ContactsStats {
  totalContacts: number
  totalGroups: number
  subscribedContacts: number
  unsubscribedContacts: number
}

export default function ContactsManager() {
  const [stats, setStats] = useState<ContactsStats>({
    totalContacts: 0,
    totalGroups: 0,
    subscribedContacts: 0,
    unsubscribedContacts: 0
  })

  useEffect(() => {
    fetchContactsStats()
  }, [])

  const fetchContactsStats = async () => {
    try {
      const response = await fetch('/api/customer/contacts/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Failed to fetch stats:', response.status)
        // Use zero data to show actual state
        setStats({
          totalContacts: 0,
          totalGroups: 0,
          subscribedContacts: 0,
          unsubscribedContacts: 0
        })
      }
    } catch (error) {
      console.error('Contacts stats error:', error)
      // Use zero data to show actual state
      setStats({
        totalContacts: 0,
        totalGroups: 0,
        subscribedContacts: 0,
        unsubscribedContacts: 0
      })
    }
  }

  const refreshStats = () => {
    fetchContactsStats()
  }

  return (
    <Card withBorder padding="lg">
      <Tabs defaultValue="contacts">
        <Tabs.List>
          <Tabs.Tab 
            value="contacts" 
            leftSection={<IconUserPlus size="1rem" />}
          >
            Contacts ({stats.totalContacts})
          </Tabs.Tab>
          <Tabs.Tab 
            value="groups" 
            leftSection={<IconUsers size="1rem" />}
          >
            Groups ({stats.totalGroups})
          </Tabs.Tab>
          <Tabs.Tab 
            value="subscriptions" 
            leftSection={<IconBell size="1rem" />}
          >
            Subscriptions ({stats.subscribedContacts})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="contacts" pt="md">
          <ContactsList onStatsChange={refreshStats} />
        </Tabs.Panel>

        <Tabs.Panel value="groups" pt="md">
          <ContactGroups onStatsChange={refreshStats} />
        </Tabs.Panel>

        <Tabs.Panel value="subscriptions" pt="md">
          <SubscriptionManager onStatsChange={refreshStats} />
        </Tabs.Panel>
      </Tabs>
    </Card>
  )
}