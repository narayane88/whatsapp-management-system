#!/usr/bin/env node

import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState,
    Browsers,
    WAMessageKey,
    WAMessage,
    downloadMediaMessage,
    getContentType
} from '@whiskeysockets/baileys'
import P from 'pino'
import { Boom } from '@hapi/boom'
import * as fs from 'fs'
import * as path from 'path'

console.log('Baileys WhatsApp Library - Executable Version')
console.log('==============================================')

// Configuration
const AUTH_DIR = './auth_session'
const DOWNLOADS_DIR = './downloads'

// Ensure directories exist
if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true })
}
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true })
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
    
    const sock = makeWASocket({
        auth: state,
        browser: Browsers.ubuntu('Baileys Executable'),
        printQRInTerminal: true,
        logger: P({ level: 'silent' })
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr) {
            console.log('\nScan the QR code above with your WhatsApp app to connect')
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Connection closed due to:', lastDisconnect?.error, 'Reconnecting:', shouldReconnect)
            
            if (shouldReconnect) {
                setTimeout(() => connectToWhatsApp(), 5000)
            } else {
                console.log('Logged out. Please delete auth_session folder and restart.')
                process.exit(1)
            }
        } else if (connection === 'open') {
            console.log('✅ Connected to WhatsApp!')
            console.log('Bot is ready to receive messages...')
            
            // Send a test message to yourself
            if (sock.user) {
                console.log(`Logged in as: ${sock.user.name} (${sock.user.id})`)
            }
        }
    })

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        console.log(`\n📨 Received ${messages.length} message(s) of type: ${type}`)
        
        for (const message of messages) {
            if (!message.key.fromMe) {
                console.log('Message from:', message.key.remoteJid)
                console.log('Message ID:', message.key.id)
                
                // Handle text messages
                if (message.message?.conversation) {
                    console.log('Text:', message.message.conversation)
                    
                    // Simple echo bot (uncomment to enable)
                    // await sock.sendMessage(message.key.remoteJid!, { 
                    //     text: `Echo: ${message.message.conversation}` 
                    // })
                }
                
                // Handle media messages
                const messageType = getContentType(message.message || {})
                if (messageType && ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(messageType)) {
                    console.log(`📎 Media message type: ${messageType}`)
                    
                    try {
                        const buffer = await downloadMediaMessage(
                            message as any,
                            'buffer',
                            {},
                            {
                                logger: P({ level: 'silent' }),
                                reuploadRequest: sock.updateMediaMessage
                            }
                        )
                        
                        const extension = messageType === 'imageMessage' ? 'jpg' : 
                                        messageType === 'videoMessage' ? 'mp4' :
                                        messageType === 'audioMessage' ? 'ogg' : 'bin'
                        
                        const filename = path.join(DOWNLOADS_DIR, `${message.key.id}.${extension}`)
                        fs.writeFileSync(filename, buffer)
                        console.log(`💾 Downloaded media to: ${filename}`)
                        
                    } catch (error) {
                        console.error('❌ Error downloading media:', error)
                    }
                }
            }
        }
    })

    // Handle message updates (read receipts, etc.)
    sock.ev.on('messages.update', (updates) => {
        for (const update of updates) {
            if (update.update.status) {
                console.log(`📱 Message ${update.key.id} status: ${update.update.status}`)
            }
        }
    })

    // Handle group events
    sock.ev.on('group-participants.update', ({ id, participants, action, author }) => {
        console.log(`👥 Group ${id}: ${action} ${participants.length} participant(s) by ${author}`)
    })

    // Save credentials when they update
    sock.ev.on('creds.update', saveCreds)

    return sock
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Baileys...')
    process.exit(0)
})

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down Baileys...')
    process.exit(0)
})

// Start the application
console.log('🚀 Starting Baileys WhatsApp Bot...')
connectToWhatsApp().catch(console.error)