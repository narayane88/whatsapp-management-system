# Baileys WhatsApp Library - Complete API Documentation

## Overview

Baileys is a comprehensive TypeScript/JavaScript library for interacting with WhatsApp Web API via WebSockets. It provides full WhatsApp functionality without requiring a browser or Selenium, making it memory-efficient and fast.

**Version**: 6.7.18  
**License**: MIT  
**Repository**: https://github.com/WhiskeySockets/Baileys

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Connection Management](#connection-management)
3. [Authentication](#authentication)
4. [Message Operations](#message-operations)
5. [Group Management](#group-management)
6. [Community Management](#community-management)
7. [Newsletter Operations](#newsletter-operations)
8. [Business Features](#business-features)
9. [Privacy & Settings](#privacy--settings)
10. [Chat Management](#chat-management)
11. [Contact Management](#contact-management)
12. [Presence & Status](#presence--status)
13. [Media Handling](#media-handling)
14. [Call Management](#call-management)
15. [Event System](#event-system)
16. [Utility Functions](#utility-functions)
17. [Type Definitions](#type-definitions)
18. [Error Handling](#error-handling)
19. [Best Practices](#best-practices)

---

## Installation & Setup

### Installation

```bash
# Stable version
npm install @whiskeysockets/baileys

# Edge version (latest features, may be unstable)
npm install github:WhiskeySockets/Baileys
```

### Basic Setup

```typescript
import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState,
    Browsers 
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    
    const sock = makeWASocket({
        auth: state,
        browser: Browsers.ubuntu('My App'),
        printQRInTerminal: true,
        logger: console // or use pino for better logging
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) {
                connectToWhatsApp()
            }
        } else if (connection === 'open') {
            console.log('Connection opened')
        }
    })

    sock.ev.on('creds.update', saveCreds)
    return sock
}
```

---

## Connection Management

### Socket Configuration

```typescript
interface SocketConfig {
    // Required
    auth: AuthenticationState
    
    // Connection settings
    waWebSocketUrl?: string | URL
    connectTimeoutMs?: number
    defaultQueryTimeoutMs?: number
    keepAliveIntervalMs?: number
    
    // Browser & Device
    browser?: WABrowserDescription
    version?: WAVersion
    
    // Message handling
    maxMsgRetryCount?: number
    retryRequestDelayMs?: number
    getMessage?: (key: WAMessageKey) => Promise<WAMessage | undefined>
    
    // Caching
    mediaCache?: CacheStore
    msgRetryCounterCache?: CacheStore
    userDevicesCache?: CacheStore
    cachedGroupMetadata?: (jid: string) => Promise<GroupMetadata | undefined>
    
    // Behavior
    markOnlineOnConnect?: boolean
    printQRInTerminal?: boolean
    generateHighQualityLinkPreview?: boolean
    shouldIgnoreJid?: (jid: string) => boolean
    
    // Sync settings
    syncFullHistory?: boolean
    
    // Logging
    logger?: Logger
}
```

### Connection Methods

```typescript
// Create socket connection
const sock = makeWASocket(config: SocketConfig): WASocket

// Request pairing code for web connection
await sock.requestPairingCode(phoneNumber: string): Promise<string>

// Logout and invalidate session
await sock.logout(msg?: string): Promise<void>

// Close connection
sock.end(error?: Error): void

// Wait for connection state changes
await sock.waitForConnectionUpdate(): Promise<ConnectionUpdate>

// Wait for socket to open
await sock.waitForSocketOpen(): Promise<void>
```

### Connection Events

```typescript
sock.ev.on('connection.update', (update: ConnectionUpdate) => {
    const { 
        connection,      // 'close' | 'connecting' | 'open'
        lastDisconnect,  // { error: Error, date: Date }
        qr,             // QR code string
        isNewLogin,     // boolean
        receivedPendingNotifications // boolean
    } = update
})
```

---

## Authentication

### QR Code Authentication

```typescript
const sock = makeWASocket({
    auth: state,
    browser: Browsers.ubuntu('My App'),
    printQRInTerminal: true
})

sock.ev.on('connection.update', ({ qr }) => {
    if (qr) {
        // QR code available - scan with WhatsApp app
        console.log('QR Code:', qr)
    }
})
```

### Pairing Code Authentication

```typescript
const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
})

if (!sock.authState.creds.registered) {
    const phoneNumber = '1234567890' // Without + or special characters
    const code = await sock.requestPairingCode(phoneNumber)
    console.log('Pairing code:', code)
}
```

### Session Management

```typescript
import { useMultiFileAuthState } from '@whiskeysockets/baileys'

// Load existing session or create new one
const { state, saveCreds } = await useMultiFileAuthState('./auth_session')

const sock = makeWASocket({
    auth: state
})

// Save session when credentials update
sock.ev.on('creds.update', saveCreds)
```

---

## Message Operations

### Sending Messages

#### Basic Message Sending

```typescript
await sock.sendMessage(jid: string, content: AnyMessageContent, options?: MessageOptions)
```

#### Text Messages

```typescript
// Simple text
await sock.sendMessage(jid, { text: 'Hello World!' })

// Text with mentions
await sock.sendMessage(jid, { 
    text: 'Hello @1234567890!', 
    mentions: ['1234567890@s.whatsapp.net'] 
})

// Reply to a message
await sock.sendMessage(jid, { text: 'Reply text' }, { quoted: originalMessage })
```

#### Media Messages

```typescript
// Image
await sock.sendMessage(jid, {
    image: { url: './path/to/image.jpg' }, // or Buffer or { stream: ReadableStream }
    caption: 'Image caption'
})

// Video
await sock.sendMessage(jid, {
    video: { url: './path/to/video.mp4' },
    caption: 'Video caption',
    gifPlayback: false, // Set to true for GIFs
    ptv: false // Set to true for video notes
})

// Audio
await sock.sendMessage(jid, {
    audio: { url: './path/to/audio.mp3' },
    mimetype: 'audio/mpeg',
    ptt: true, // Set to true for voice notes
    seconds: 60 // Duration in seconds
})

// Document
await sock.sendMessage(jid, {
    document: { url: './path/to/document.pdf' },
    mimetype: 'application/pdf',
    fileName: 'document.pdf'
})

// Sticker
await sock.sendMessage(jid, {
    sticker: { url: './path/to/sticker.webp' }
})
```

#### Special Messages

```typescript
// Location
await sock.sendMessage(jid, {
    location: {
        degreesLatitude: 24.121231,
        degreesLongitude: 55.1121221
    }
})

// Contact
await sock.sendMessage(jid, {
    contacts: {
        displayName: 'John Doe',
        contacts: [{
            vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEND:VCARD'
        }]
    }
})

// Poll
await sock.sendMessage(jid, {
    poll: {
        name: 'Choose your favorite color',
        values: ['Red', 'Blue', 'Green', 'Yellow'],
        selectableCount: 1
    }
})

// Reaction
await sock.sendMessage(jid, {
    react: {
        text: '👍', // Use empty string to remove reaction
        key: messageKey
    }
})

// Forward message
await sock.sendMessage(jid, { forward: originalMessage })

// Delete message
await sock.sendMessage(jid, { delete: messageKey })

// Edit message
await sock.sendMessage(jid, {
    text: 'Edited text',
    edit: messageKey
})

// Pin message
await sock.sendMessage(jid, {
    pin: {
        type: 1, // 1 to pin, 0 to unpin
        time: 86400, // Duration in seconds (24h, 7d, 30d)
        key: messageKey
    }
})

// View once message
await sock.sendMessage(jid, {
    image: { url: './image.jpg' },
    viewOnce: true
})
```

### Message Events

```typescript
// New messages received
sock.ev.on('messages.upsert', ({ messages, type }) => {
    for (const message of messages) {
        console.log('New message:', message)
    }
})

// Message updates (read status, delivery, etc.)
sock.ev.on('messages.update', (updates) => {
    for (const update of updates) {
        console.log('Message update:', update)
    }
})

// Messages deleted
sock.ev.on('messages.delete', ({ keys }) => {
    console.log('Deleted messages:', keys)
})

// Message reactions
sock.ev.on('messages.reaction', (reactions) => {
    for (const reaction of reactions) {
        console.log('Reaction:', reaction)
    }
})

// Message receipts (read confirmations)
sock.ev.on('message-receipt.update', (receipts) => {
    for (const receipt of receipts) {
        console.log('Receipt:', receipt)
    }
})
```

### Message Utilities

```typescript
// Mark messages as read
await sock.readMessages([messageKey1, messageKey2])

// Send typing/recording indicator
await sock.sendPresenceUpdate('composing', jid) // or 'recording', 'paused'

// Download media from message
import { downloadMediaMessage } from '@whiskeysockets/baileys'
const buffer = await downloadMediaMessage(message, 'buffer')
```

---

## Group Management

### Basic Group Operations

```typescript
// Create group
const group = await sock.groupCreate('Group Name', [
    '1234567890@s.whatsapp.net',
    '0987654321@s.whatsapp.net'
])

// Get group metadata
const metadata = await sock.groupMetadata(groupJid)

// Get all participating groups
const allGroups = await sock.groupFetchAllParticipating()

// Leave group
await sock.groupLeave(groupJid)
```

### Group Information Management

```typescript
// Update group subject (name)
await sock.groupUpdateSubject(groupJid, 'New Group Name')

// Update group description
await sock.groupUpdateDescription(groupJid, 'New description')

// Update group picture
await sock.updateProfilePicture(groupJid, { url: './group-pic.jpg' })

// Remove group picture
await sock.removeProfilePicture(groupJid)
```

### Participant Management

```typescript
// Add participants
await sock.groupParticipantsUpdate(groupJid, [
    '1234567890@s.whatsapp.net'
], 'add')

// Remove participants
await sock.groupParticipantsUpdate(groupJid, [
    '1234567890@s.whatsapp.net'
], 'remove')

// Promote to admin
await sock.groupParticipantsUpdate(groupJid, [
    '1234567890@s.whatsapp.net'
], 'promote')

// Demote from admin
await sock.groupParticipantsUpdate(groupJid, [
    '1234567890@s.whatsapp.net'
], 'demote')
```

### Group Settings

```typescript
// Group messaging permissions
await sock.groupSettingUpdate(groupJid, 'announcement') // Only admins can send
await sock.groupSettingUpdate(groupJid, 'not_announcement') // Everyone can send

// Group info edit permissions
await sock.groupSettingUpdate(groupJid, 'locked') // Only admins can edit
await sock.groupSettingUpdate(groupJid, 'unlocked') // Everyone can edit

// Add participant mode
await sock.groupMemberAddMode(groupJid, 'admin_add') // Only admins can add
await sock.groupMemberAddMode(groupJid, 'all_member_add') // Everyone can add

// Join approval mode
await sock.groupJoinApprovalMode(groupJid, 'on') // Require admin approval
await sock.groupJoinApprovalMode(groupJid, 'off') // Auto-approve joins

// Ephemeral (disappearing) messages
await sock.groupToggleEphemeral(groupJid, 86400) // 24 hours in seconds, 0 to disable
```

### Group Invitations

```typescript
// Get group invite code
const inviteCode = await sock.groupInviteCode(groupJid)
const inviteLink = `https://chat.whatsapp.com/${inviteCode}`

// Revoke current invite code (generates new one)
const newCode = await sock.groupRevokeInvite(groupJid)

// Join group using invite code
const result = await sock.groupAcceptInvite(inviteCode)

// Get group info from invite code
const groupInfo = await sock.groupGetInviteInfo(inviteCode)

// Accept invite using groupInviteMessage
await sock.groupAcceptInviteV4(myJid, groupInviteMessage)
```

### Group Join Requests

```typescript
// Get pending join requests
const requests = await sock.groupRequestParticipantsList(groupJid)

// Approve join requests
await sock.groupRequestParticipantsUpdate(groupJid, [
    '1234567890@s.whatsapp.net'
], 'approve')

// Reject join requests
await sock.groupRequestParticipantsUpdate(groupJid, [
    '1234567890@s.whatsapp.net'
], 'reject')
```

### Group Events

```typescript
// New groups
sock.ev.on('groups.upsert', (groups) => {
    console.log('New groups:', groups)
})

// Group updates
sock.ev.on('groups.update', (updates) => {
    console.log('Group updates:', updates)
})

// Participant changes
sock.ev.on('group-participants.update', ({ id, participants, action, author }) => {
    console.log(`Group ${id}: ${action} participants ${participants} by ${author}`)
})
```

---

## Community Management

WhatsApp Communities are collections of groups with shared administration.

### Community Operations

```typescript
// Create community
const community = await sock.communityCreate('Community Name', 'Community description')

// Leave community
await sock.communityLeave(communityJid)

// Update community subject
await sock.communityUpdateSubject(communityJid, 'New Community Name')

// Update community description
await sock.communityUpdateDescription(communityJid, 'New description')

// Manage community participants
await sock.communityParticipantsUpdate(communityJid, [
    '1234567890@s.whatsapp.net'
], 'add') // or 'remove', 'promote', 'demote'

// Community ephemeral settings
await sock.communityToggleEphemeral(communityJid, 86400)

// Get community invite code
const inviteCode = await sock.communityInviteCode(communityJid)

// Accept community invite
await sock.communityAcceptInvite(inviteCode)
```

---

## Newsletter Operations

WhatsApp Newsletters are broadcast channels for sharing updates with subscribers.

### Newsletter Management

```typescript
// Create newsletter
const newsletter = await sock.newsletterCreate('Newsletter Name', 'Description')

// Follow/subscribe to newsletter
await sock.newsletterFollow(newsletterJid)

// Unfollow/unsubscribe from newsletter
await sock.newsletterUnfollow(newsletterJid)

// Mute newsletter notifications
await sock.newsletterMute(newsletterJid)

// Unmute newsletter notifications
await sock.newsletterUnmute(newsletterJid)

// Update newsletter name
await sock.newsletterUpdateName(newsletterJid, 'New Name')

// Update newsletter description
await sock.newsletterUpdateDescription(newsletterJid, 'New Description')

// Update newsletter picture
await sock.newsletterUpdatePicture(newsletterJid, { url: './newsletter-pic.jpg' })

// React to newsletter message
await sock.newsletterReactMessage(newsletterJid, messageServerId, '👍')

// Fetch newsletter messages
const messages = await sock.newsletterFetchMessages(newsletterJid, 20, Date.now(), 0)
```

---

## Business Features

### Catalog Management

```typescript
// Get business catalog
const catalog = await sock.getCatalog({
    jid: businessJid,
    limit: 50,
    cursor: undefined // For pagination
})

// Get product collections
const collections = await sock.getCollections(businessJid, 10)

// Get specific product
const product = await sock.getProduct(productId)

// Create product
const newProduct = await sock.productCreate({
    name: 'Product Name',
    description: 'Product Description',
    price: 1000, // Price in smallest currency unit
    currency: 'USD',
    images: [{ url: './product-image.jpg' }]
})

// Update product
await sock.updateProduct(productId, {
    name: 'Updated Name',
    price: 1500
})

// Delete product
await sock.deleteProduct(productId)
```

### Order Management

```typescript
// Get order details
const orderDetails = await sock.getOrderDetails(orderId, tokenBase64)
```

---

## Privacy & Settings

### Privacy Settings

```typescript
// Get current privacy settings
const privacySettings = await sock.fetchPrivacySettings(true)

// Update last seen privacy
await sock.updateLastSeenPrivacy('contacts') // 'all', 'contacts', 'contact_blacklist', 'none'

// Update online status privacy
await sock.updateOnlinePrivacy('match_last_seen') // 'all', 'match_last_seen'

// Update profile picture privacy
await sock.updateProfilePicturePrivacy('contacts') // 'all', 'contacts', 'contact_blacklist', 'none'

// Update status privacy
await sock.updateStatusPrivacy('contacts') // 'all', 'contacts', 'contact_blacklist', 'none'

// Update read receipts privacy
await sock.updateReadReceiptsPrivacy('all') // 'all', 'none'

// Update groups add privacy
await sock.updateGroupsAddPrivacy('contacts') // 'all', 'contacts', 'contact_blacklist'

// Update default disappearing message mode
await sock.updateDefaultDisappearingMode(604800) // 7 days in seconds, 0 to disable
```

### Profile Management

```typescript
// Update profile name
await sock.updateProfileName('New Name')

// Update profile status
await sock.updateProfileStatus('New status message')

// Update profile picture
await sock.updateProfilePicture(sock.user.id, { url: './profile-pic.jpg' })

// Remove profile picture
await sock.removeProfilePicture(sock.user.id)

// Get profile picture URL
const profilePicUrl = await sock.profilePictureUrl(jid, 'image') // 'image' or 'preview'

// Get profile status
const status = await sock.fetchStatus(jid)

// Get business profile
const businessProfile = await sock.getBusinessProfile(jid)
```

---

## Chat Management

### Chat Operations

```typescript
// Archive/unarchive chat
const lastMessage = await getLastMessageInChat(jid) // Implement this function
await sock.chatModify({ archive: true, lastMessages: [lastMessage] }, jid)
await sock.chatModify({ archive: false, lastMessages: [lastMessage] }, jid)

// Pin/unpin chat
await sock.chatModify({ pin: true }, jid)
await sock.chatModify({ pin: false }, jid)

// Mute/unmute chat
await sock.chatModify({ mute: 8 * 60 * 60 * 1000 }, jid) // 8 hours
await sock.chatModify({ mute: null }, jid) // Unmute

// Mark chat as read/unread
await sock.chatModify({ markRead: true, lastMessages: [lastMessage] }, jid)
await sock.chatModify({ markRead: false, lastMessages: [lastMessage] }, jid)

// Delete messages for me
await sock.chatModify({
    clear: {
        messages: [{
            id: messageId,
            fromMe: true,
            timestamp: messageTimestamp
        }]
    }
}, jid)

// Delete entire chat
await sock.chatModify({
    delete: true,
    lastMessages: [{
        key: lastMessage.key,
        messageTimestamp: lastMessage.messageTimestamp
    }]
}, jid)

// Star/unstar messages
await sock.chatModify({
    star: {
        messages: [{
            id: messageId,
            fromMe: true
        }],
        star: true // false to unstar
    }
}, jid)
```

### Message History

```typescript
// Fetch older messages
const oldestMessage = await getOldestMessageInChat(jid) // Implement this function
await sock.fetchMessageHistory(50, oldestMessage.key, oldestMessage.messageTimestamp)

// Messages will be received in 'messaging.history-set' event
sock.ev.on('messaging.history-set', ({ chats, isLatest }) => {
    console.log('Received history for chats:', chats)
})
```

### Chat Events

```typescript
// New chats
sock.ev.on('chats.upsert', (chats) => {
    console.log('New chats:', chats)
})

// Chat updates
sock.ev.on('chats.update', (updates) => {
    console.log('Chat updates:', updates)
})

// Chats deleted
sock.ev.on('chats.delete', (deletedChatIds) => {
    console.log('Deleted chats:', deletedChatIds)
})
```

---

## Contact Management

### Contact Operations

```typescript
// Check if number exists on WhatsApp
const [result] = await sock.onWhatsApp(phoneNumber)
if (result.exists) {
    console.log(`${phoneNumber} exists as ${result.jid}`)
}

// Check multiple numbers
const results = await sock.onWhatsApp('1234567890', '0987654321')

// Get blocklist
const blocklist = await sock.fetchBlocklist()

// Block user
await sock.updateBlockStatus(jid, 'block')

// Unblock user
await sock.updateBlockStatus(jid, 'unblock')
```

### Contact Events

```typescript
// New contacts
sock.ev.on('contacts.upsert', (contacts) => {
    console.log('New contacts:', contacts)
})

// Contact updates
sock.ev.on('contacts.update', (updates) => {
    console.log('Contact updates:', updates)
})

// Blocklist changes
sock.ev.on('blocklist.set', ({ blocklist }) => {
    console.log('Blocklist set:', blocklist)
})

sock.ev.on('blocklist.update', ({ blocklist, type }) => {
    console.log(`Blocklist ${type}:`, blocklist)
})
```

---

## Presence & Status

### Presence Management

```typescript
// Send presence update
await sock.sendPresenceUpdate('available', jid) // 'available', 'unavailable'
await sock.sendPresenceUpdate('composing', jid) // Show typing
await sock.sendPresenceUpdate('recording', jid) // Show recording
await sock.sendPresenceUpdate('paused', jid) // Pause typing

// Subscribe to presence updates
await sock.presenceSubscribe(jid)
```

### Presence Events

```typescript
sock.ev.on('presence.update', ({ id, presences }) => {
    Object.entries(presences).forEach(([jid, presence]) => {
        console.log(`${jid} is ${presence.lastKnownPresence}`)
    })
})
```

---

## Media Handling

### Downloading Media

```typescript
import { downloadMediaMessage, getContentType } from '@whiskeysockets/baileys'
import { createWriteStream } from 'fs'

sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
        const messageType = getContentType(message)
        
        if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(messageType)) {
            try {
                const buffer = await downloadMediaMessage(
                    message,
                    'buffer', // or 'stream'
                    {},
                    {
                        logger: console,
                        reuploadRequest: sock.updateMediaMessage
                    }
                )
                
                // Save to file
                const extension = messageType === 'imageMessage' ? 'jpg' : 
                                messageType === 'videoMessage' ? 'mp4' :
                                messageType === 'audioMessage' ? 'ogg' : 'bin'
                
                const filename = `./downloads/${message.key.id}.${extension}`
                require('fs').writeFileSync(filename, buffer)
                
            } catch (error) {
                console.error('Error downloading media:', error)
            }
        }
    }
})
```

### Media Upload Types

```typescript
// Media can be provided as:
type WAMediaUpload = 
    | { url: string }           // File URL/path
    | { stream: ReadableStream } // Stream
    | Buffer                    // Direct buffer

// Examples:
await sock.sendMessage(jid, {
    image: { url: './image.jpg' },        // File path
    // or
    image: { stream: fs.createReadStream('./image.jpg') }, // Stream
    // or
    image: fs.readFileSync('./image.jpg') // Buffer
})
```

### Re-uploading Media

```typescript
// Re-upload media that has been deleted from WhatsApp servers
await sock.updateMediaMessage(message)
```

---

## Call Management

### Call Operations

```typescript
// Reject incoming call
await sock.rejectCall(callId, callFrom)
```

### Call Events

```typescript
sock.ev.on('call', (calls) => {
    for (const call of calls) {
        console.log('Incoming call from:', call.from)
        // Auto-reject all calls
        await sock.rejectCall(call.id, call.from)
    }
})
```

---

## Event System

### Core Events

```typescript
// Connection events
sock.ev.on('connection.update', callback)
sock.ev.on('creds.update', callback)

// Message events
sock.ev.on('messages.upsert', callback)
sock.ev.on('messages.update', callback)
sock.ev.on('messages.delete', callback)
sock.ev.on('messages.reaction', callback)
sock.ev.on('message-receipt.update', callback)

// Chat events
sock.ev.on('chats.upsert', callback)
sock.ev.on('chats.update', callback)
sock.ev.on('chats.delete', callback)

// Group events
sock.ev.on('groups.upsert', callback)
sock.ev.on('groups.update', callback)
sock.ev.on('group-participants.update', callback)

// Contact events
sock.ev.on('contacts.upsert', callback)
sock.ev.on('contacts.update', callback)

// Presence events
sock.ev.on('presence.update', callback)

// Blocklist events
sock.ev.on('blocklist.set', callback)
sock.ev.on('blocklist.update', callback)

// Call events
sock.ev.on('call', callback)

// History events
sock.ev.on('messaging.history-set', callback)
```

### Event Emitter Methods

```typescript
// Listen to event
sock.ev.on(event, callback)

// Listen once
sock.ev.once(event, callback)

// Remove listener
sock.ev.off(event, callback)

// Remove all listeners
sock.ev.removeAllListeners(event?)

// Emit event
sock.ev.emit(event, ...args)
```

---

## Utility Functions

### Message Utilities

```typescript
import { 
    getContentType,
    getDevice,
    downloadContentFromMessage,
    generateWAMessageFromContent,
    generateWAMessage
} from '@whiskeysockets/baileys'

// Get message content type
const contentType = getContentType(message)

// Get device information from message
const device = getDevice(message.key.id)

// Download content from message
const stream = await downloadContentFromMessage(message, 'image')
```

### JID (WhatsApp ID) Utilities

```typescript
import { 
    jidDecode,
    jidEncode,
    jidNormalizedUser,
    areJidsSameUser,
    isJidBroadcast,
    isJidGroup,
    isJidUser,
    isJidStatusBroadcast
} from '@whiskeysockets/baileys'

// Decode JID
const decoded = jidDecode('1234567890@s.whatsapp.net')
// { user: '1234567890', server: 's.whatsapp.net', domain: 'whatsapp.net' }

// Encode JID
const encoded = jidEncode('1234567890', 's.whatsapp.net')
// '1234567890@s.whatsapp.net'

// Normalize user JID
const normalized = jidNormalizedUser('1234567890@s.whatsapp.net')
// '1234567890@s.whatsapp.net'

// Check if JIDs belong to same user
const same = areJidsSameUser(jid1, jid2)

// Check JID types
const isBroadcast = isJidBroadcast(jid)     // broadcast list
const isGroup = isJidGroup(jid)             // group chat
const isUser = isJidUser(jid)               // individual user
const isStatus = isJidStatusBroadcast(jid)  // status broadcast
```

### Binary Node Utilities

```typescript
import { 
    getBinaryNodeChild,
    getBinaryNodeChildren,
    S_WHATSAPP_NET
} from '@whiskeysockets/baileys'

// Get child node
const child = getBinaryNodeChild(node, 'tag')

// Get all children
const children = getBinaryNodeChildren(node, 'tag')
```

### Cryptographic Utilities

```typescript
import { 
    Curve,
    signedKeyPair,
    generateSignalPubKey
} from '@whiskeysockets/baileys'

// Generate key pair
const keyPair = Curve.generateKeyPair()

// Generate signed key pair
const signedKeys = signedKeyPair(keyPair, Date.now())
```

---

## Type Definitions

### Core Types

```typescript
// Main socket type
type WASocket = ReturnType<typeof makeWASocket>

// Message types
interface WAMessage {
    key: WAMessageKey
    message?: IMessage
    messageTimestamp?: number
    status?: WAMessageStatus
    participant?: string
    pushName?: string
    broadcast?: boolean
    messageStubType?: MessageStubType
    messageStubParameters?: string[]
}

interface WAMessageKey {
    id: string
    remoteJid: string
    fromMe: boolean
    participant?: string
}

// Chat types
interface Chat {
    id: string
    name?: string
    conversationTimestamp?: number
    unreadCount?: number
    archived?: boolean
    pinned?: number
    muteEndTime?: number
    lastMessageRecvTimestamp?: number
}

// Contact types
interface Contact {
    id: string
    name?: string
    notify?: string
    verifiedName?: string
    imgUrl?: string
    status?: string
}

// Group types
interface GroupMetadata {
    id: string
    owner?: string
    subject: string
    subjectOwner?: string
    subjectTime?: number
    creation?: number
    desc?: string
    descOwner?: string
    descId?: string
    restrict?: boolean
    announce?: boolean
    size?: number
    participants: GroupParticipant[]
    ephemeralDuration?: number
    joinApprovalMode?: boolean
    memberAddMode?: boolean
}

interface GroupParticipant {
    id: string
    admin?: 'admin' | 'superadmin'
}
```

### Configuration Types

```typescript
interface SocketConfig {
    waWebSocketUrl?: string | URL
    connectTimeoutMs?: number
    defaultQueryTimeoutMs?: number
    keepAliveIntervalMs?: number
    retryRequestDelayMs?: number
    maxMsgRetryCount?: number
    
    auth: AuthenticationState
    logger?: Logger
    version?: WAVersion
    browser?: WABrowserDescription
    
    printQRInTerminal?: boolean
    markOnlineOnConnect?: boolean
    syncFullHistory?: boolean
    
    mediaCache?: CacheStore
    msgRetryCounterCache?: CacheStore
    userDevicesCache?: CacheStore
    
    getMessage?: (key: WAMessageKey) => Promise<WAMessage | undefined>
    generateHighQualityLinkPreview?: boolean
    shouldIgnoreJid?: (jid: string) => boolean
    cachedGroupMetadata?: (jid: string) => Promise<GroupMetadata | undefined>
}

interface AuthenticationState {
    creds: AuthenticationCreds
    keys: SignalKeyStore
}
```

### Event Types

```typescript
interface BaileysEventMap {
    'connection.update': Partial<ConnectionState>
    'creds.update': Partial<AuthenticationCreds>
    'messaging.history-set': { chats: Chat[]; isLatest: boolean }
    'chats.upsert': Chat[]
    'chats.update': Partial<Chat>[]
    'chats.delete': string[]
    'contacts.upsert': Contact[]
    'contacts.update': Partial<Contact>[]
    'messages.delete': { keys: WAMessageKey[] } | { jid: string; all: true }
    'messages.update': WAMessageUpdate[]
    'messages.upsert': MessageUpsertType
    'messages.reaction': ReactionMessage[]
    'message-receipt.update': MessageUserReceiptUpdate[]
    'groups.upsert': GroupMetadata[]
    'groups.update': Partial<GroupMetadata>[]
    'group-participants.update': GroupParticipantsUpdate
    'blocklist.set': { blocklist: string[] }
    'blocklist.update': { blocklist: string[]; type: 'add' | 'remove' }
    'presence.update': PresenceData
    'call': WACallEvent[]
}
```

---

## Error Handling

### Common Errors

```typescript
import { DisconnectReason, Boom } from '@whiskeysockets/baileys'

sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
        
        if (lastDisconnect?.error) {
            const statusCode = (lastDisconnect.error as Boom)?.output?.statusCode
            
            switch (statusCode) {
                case DisconnectReason.loggedOut:
                    console.log('Device logged out, delete session and scan QR again')
                    break
                case DisconnectReason.connectionClosed:
                    console.log('Connection closed, reconnecting...')
                    break
                case DisconnectReason.connectionLost:
                    console.log('Connection lost, reconnecting...')
                    break
                case DisconnectReason.connectionReplaced:
                    console.log('Connection replaced by another session')
                    break
                case DisconnectReason.timedOut:
                    console.log('Connection timed out, reconnecting...')
                    break
                case DisconnectReason.restartRequired:
                    console.log('Restart required')
                    break
                default:
                    console.log('Unknown disconnect reason:', statusCode)
            }
        }
        
        if (shouldReconnect) {
            connectToWhatsApp() // Reconnect
        }
    }
})
```

### Message Send Errors

```typescript
try {
    await sock.sendMessage(jid, { text: 'Hello' })
} catch (error) {
    if (error.code === 'invalid-jid') {
        console.log('Invalid JID provided')
    } else if (error.code === 'not-authorized') {
        console.log('Not authorized to send message to this JID')
    } else {
        console.log('Send message error:', error)
    }
}
```

---

## Best Practices

### 1. Authentication Management

```typescript
// Always save credentials when they update
sock.ev.on('creds.update', saveCreds)

// Use proper session storage for production
// Instead of useMultiFileAuthState, implement database storage
const { state, saveCreds } = await useDatabaseAuthState() // Custom implementation
```

### 2. Message Handling

```typescript
// Always iterate through messages array
sock.ev.on('messages.upsert', ({ messages }) => {
    for (const message of messages) {
        // Process each message
    }
})

// Implement proper message store for getMessage function
const sock = makeWASocket({
    getMessage: async (key) => {
        // Retrieve message from your database/store
        return await getMessageFromStore(key)
    }
})
```

### 3. Group Metadata Caching

```typescript
// Cache group metadata for better performance
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })

const sock = makeWASocket({
    cachedGroupMetadata: async (jid) => groupCache.get(jid)
})

sock.ev.on('groups.update', async ([event]) => {
    const metadata = await sock.groupMetadata(event.id)
    groupCache.set(event.id, metadata)
})
```

### 4. Error Handling

```typescript
// Implement proper reconnection logic
const connectWithRetry = async (retries = 5) => {
    for (let i = 0; i < retries; i++) {
        try {
            await connectToWhatsApp()
            break
        } catch (error) {
            console.log(`Connection attempt ${i + 1} failed:`, error)
            if (i === retries - 1) throw error
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
    }
}
```

### 5. Memory Management

```typescript
// Implement proper data store instead of in-memory store
import { makeInMemoryStore } from '@whiskeysockets/baileys'

// For development only
const store = makeInMemoryStore({})
store.bind(sock.ev)

// For production, implement database store
const dbStore = makeDatabaseStore() // Your implementation
dbStore.bind(sock.ev)
```

### 6. Rate Limiting

```typescript
// Implement rate limiting for message sending
const sendQueue = []
const RATE_LIMIT = 20 // messages per minute

setInterval(async () => {
    if (sendQueue.length > 0) {
        const batch = sendQueue.splice(0, RATE_LIMIT)
        for (const { jid, content, options } of batch) {
            try {
                await sock.sendMessage(jid, content, options)
            } catch (error) {
                console.error('Send failed:', error)
            }
        }
    }
}, 60000)

function queueMessage(jid, content, options) {
    sendQueue.push({ jid, content, options })
}
```

### 7. Logging

```typescript
import pino from 'pino'

const logger = pino({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
})

const sock = makeWASocket({
    logger,
    // ... other config
})
```

---

## Common Use Cases

### 1. Auto-Reply Bot

```typescript
sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
        if (!message.key.fromMe && message.message?.conversation) {
            const text = message.message.conversation.toLowerCase()
            const jid = message.key.remoteJid
            
            if (text.includes('hello')) {
                await sock.sendMessage(jid, { text: 'Hello! How can I help you?' })
            }
        }
    }
})
```

### 2. File Downloader

```typescript
sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
        const messageType = getContentType(message)
        
        if (['imageMessage', 'videoMessage', 'documentMessage'].includes(messageType)) {
            try {
                const buffer = await downloadMediaMessage(message, 'buffer')
                const filename = `./downloads/${message.key.id}_${Date.now()}`
                fs.writeFileSync(filename, buffer)
                console.log(`Downloaded: ${filename}`)
            } catch (error) {
                console.error('Download failed:', error)
            }
        }
    }
})
```

### 3. Group Management Bot

```typescript
sock.ev.on('group-participants.update', async ({ id, participants, action, author }) => {
    if (action === 'add') {
        // Welcome new members
        await sock.sendMessage(id, {
            text: `Welcome ${participants.map(p => '@' + p.split('@')[0]).join(', ')} to the group!`,
            mentions: participants
        })
    }
})
```

---

This documentation covers the complete Baileys WhatsApp library API. For additional information, examples, and updates, visit the [official repository](https://github.com/WhiskeySockets/Baileys) and [documentation site](https://baileys.wiki).