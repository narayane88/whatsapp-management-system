// Base API URL - Update this to match your server
const API_BASE_URL = 'http://localhost:3005/api';

// Global variables
let currentMessageType = 'text';
let connectedAccounts = [];
let serverHealthInterval;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkHealth();
    loadAccounts();
    startHealthMonitoring();
});

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, mergedOptions);
        const data = await response.json();
        
        return {
            success: response.ok,
            status: response.status,
            data: data
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}

// Server Health Functions
async function checkHealth() {
    showLoading('health-response');
    
    const result = await apiRequest('/health');
    
    if (result.success) {
        displayResponse('health-response', result.data, 'success');
        updateServerStatus(true, result.data.data);
    } else {
        displayResponse('health-response', result.error || 'Server is not responding', 'error');
        updateServerStatus(false);
    }
}

async function getServerStats() {
    showLoading('health-response');
    
    const result = await apiRequest('/stats');
    
    if (result.success) {
        displayResponse('health-response', result.data, 'success');
        displayServerStats(result.data.data);
    } else {
        displayResponse('health-response', result.error || 'Failed to get server stats', 'error');
    }
}

function startHealthMonitoring() {
    // Check server health every 30 seconds
    serverHealthInterval = setInterval(async () => {
        const result = await apiRequest('/health');
        updateServerStatus(result.success, result.data?.data);
    }, 30000);
}

function updateServerStatus(isHealthy, healthData) {
    const statusElement = document.getElementById('server-status');
    
    if (isHealthy) {
        statusElement.innerHTML = `
            <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 5px; margin-top: 10px;">
                <span style="color: #90EE90;">🟢 Server Online</span>
                ${healthData ? ` | Uptime: ${Math.round(healthData.uptime)}s | Accounts: ${healthData.accounts.total}` : ''}
            </div>
        `;
    } else {
        statusElement.innerHTML = `
            <div style="background: rgba(255,0,0,0.2); padding: 10px; border-radius: 5px; margin-top: 10px;">
                <span style="color: #FFB6C1;">🔴 Server Offline</span>
            </div>
        `;
    }
}

function displayServerStats(stats) {
    const statsHtml = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.accounts.total}</div>
                <div class="stat-label">Total Accounts</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.accounts.byStatus.connected || 0}</div>
                <div class="stat-label">Connected</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.accounts.byStatus.connecting || 0}</div>
                <div class="stat-label">Connecting</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(stats.server.uptime)}s</div>
                <div class="stat-label">Uptime</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(stats.server.memory.heapUsed / 1024 / 1024)}MB</div>
                <div class="stat-label">Memory Used</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.server.platform}</div>
                <div class="stat-label">Platform</div>
            </div>
        </div>
    `;
    
    document.getElementById('health-response').innerHTML = statsHtml;
    document.getElementById('health-response').className = 'response success';
    document.getElementById('health-response').classList.remove('hidden');
}

// Account Management Functions
async function connectAccount(event) {
    event.preventDefault();
    
    const accountId = document.getElementById('account-id').value.trim();
    const phoneNumber = document.getElementById('phone-number').value.trim();
    const webhookUrl = document.getElementById('webhook-url').value.trim();
    const usePairingCode = document.getElementById('use-pairing-code').checked;
    
    const requestBody = {
        usePairingCode
    };
    
    if (accountId) requestBody.id = accountId;
    if (phoneNumber) requestBody.phoneNumber = phoneNumber;
    if (webhookUrl) requestBody.webhookUrl = webhookUrl;
    
    showLoading('connect-response');
    
    const result = await apiRequest('/accounts/connect', {
        method: 'POST',
        body: JSON.stringify(requestBody)
    });
    
    if (result.success) {
        displayResponse('connect-response', result.data, 'success');
        
        // Clear form
        document.getElementById('account-id').value = '';
        document.getElementById('phone-number').value = '';
        document.getElementById('webhook-url').value = '';
        document.getElementById('use-pairing-code').checked = false;
        
        // Refresh accounts list
        setTimeout(() => loadAccounts(), 1000);
        
        // Start polling for QR code/connection status
        if (result.data.data && result.data.data.id) {
            startConnectionPolling(result.data.data.id);
        }
    } else {
        displayResponse('connect-response', result.error || 'Failed to connect account', 'error');
    }
}

function startConnectionPolling(accountId) {
    const pollInterval = setInterval(async () => {
        const result = await apiRequest(`/accounts/${accountId}/status`);
        
        if (result.success) {
            const account = result.data.data;
            
            // Update the account card with latest status
            updateAccountCard(account);
            
            // Stop polling if connected or disconnected
            if (account.status === 'connected' || account.status === 'disconnected') {
                clearInterval(pollInterval);
                loadAccounts(); // Refresh the full list
            }
        }
    }, 3000); // Poll every 3 seconds
    
    // Stop polling after 5 minutes to avoid infinite polling
    setTimeout(() => clearInterval(pollInterval), 300000);
}

async function loadAccounts() {
    const result = await apiRequest('/accounts');
    
    if (result.success) {
        connectedAccounts = result.data.data.accounts;
        displayAccounts(connectedAccounts);
        updateAccountSelector(connectedAccounts);
    } else {
        document.getElementById('accounts-container').innerHTML = 
            `<div class="response error">Failed to load accounts: ${result.error || 'Unknown error'}</div>`;
    }
}

function displayAccounts(accounts) {
    const container = document.getElementById('accounts-container');
    
    if (accounts.length === 0) {
        container.innerHTML = '<div class="response">No accounts connected yet.</div>';
        return;
    }
    
    const accountsHtml = accounts.map(account => `
        <div class="account-card ${account.status}" id="account-${account.id}">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                <h3>${account.id}</h3>
                <span class="status-badge status-${account.status}">${account.status}</span>
            </div>
            
            ${account.phoneNumber ? `<p><strong>Phone:</strong> ${account.phoneNumber}</p>` : ''}
            ${account.lastSeen ? `<p><strong>Last Seen:</strong> ${new Date(account.lastSeen).toLocaleString()}</p>` : ''}
            
            ${account.qrCode ? `
                <div class="qr-code">
                    <p><strong>Scan QR Code with WhatsApp:</strong></p>
                    <img src="${account.qrCode}" alt="QR Code" />
                </div>
            ` : ''}
            
            ${account.pairingCode ? `
                <div style="text-align: center; margin: 10px 0;">
                    <p><strong>Pairing Code:</strong></p>
                    <div style="font-size: 24px; font-weight: bold; color: #25d366; padding: 10px; background: #f0f8ff; border-radius: 5px;">
                        ${account.pairingCode}
                    </div>
                    <small>Enter this code in WhatsApp > Linked Devices > Link a Device</small>
                </div>
            ` : ''}
            
            <div style="margin-top: 15px;">
                <button onclick="getAccountStatus('${account.id}')">Refresh Status</button>
                <button onclick="getQRCode('${account.id}')">Get QR Code</button>
                <button onclick="disconnectAccount('${account.id}')" style="background: #dc3545;">Disconnect</button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = `<div class="accounts-grid">${accountsHtml}</div>`;
}

function updateAccountCard(account) {
    const cardElement = document.getElementById(`account-${account.id}`);
    if (cardElement) {
        // Update the entire card with fresh data
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = displayAccounts([account]);
        const newCard = tempDiv.querySelector('.account-card');
        if (newCard) {
            cardElement.outerHTML = newCard.outerHTML;
        }
    }
}

function updateAccountSelector(accounts) {
    const selector = document.getElementById('sender-account');
    selector.innerHTML = '<option value="">Select an account...</option>';
    
    accounts.forEach(account => {
        if (account.status === 'connected') {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.id} (${account.phoneNumber || 'Unknown'})`;
            selector.appendChild(option);
        }
    });
}

async function getAccountStatus(accountId) {
    const result = await apiRequest(`/accounts/${accountId}/status`);
    
    if (result.success) {
        updateAccountCard(result.data.data);
        displayResponse('connect-response', result.data, 'success');
    } else {
        displayResponse('connect-response', result.error || 'Failed to get account status', 'error');
    }
}

async function getQRCode(accountId) {
    const result = await apiRequest(`/accounts/${accountId}/qr`);
    
    if (result.success) {
        displayResponse('connect-response', result.data, 'success');
        // The QR code will be updated in the account card through the polling
        setTimeout(() => getAccountStatus(accountId), 1000);
    } else {
        displayResponse('connect-response', result.error || 'QR code not available', 'error');
    }
}

async function disconnectAccount(accountId) {
    if (!confirm(`Are you sure you want to disconnect account ${accountId}?`)) {
        return;
    }
    
    const result = await apiRequest(`/accounts/${accountId}/disconnect`, {
        method: 'DELETE'
    });
    
    if (result.success) {
        displayResponse('connect-response', result.data, 'success');
        loadAccounts(); // Refresh accounts list
    } else {
        displayResponse('connect-response', result.error || 'Failed to disconnect account', 'error');
    }
}

// Message Functions
function selectMessageType(type) {
    currentMessageType = type;
    
    // Update active button
    document.querySelectorAll('.message-type').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide appropriate fields
    document.querySelectorAll('.message-fields').forEach(fields => {
        fields.classList.add('hidden');
    });
    
    switch(type) {
        case 'text':
            document.getElementById('text-fields').classList.remove('hidden');
            break;
        case 'image':
        case 'video':
        case 'audio':
            document.getElementById('media-fields').classList.remove('hidden');
            break;
        case 'document':
            document.getElementById('document-fields').classList.remove('hidden');
            break;
        case 'location':
            document.getElementById('location-fields').classList.remove('hidden');
            break;
    }
}

async function sendMessage(event) {
    event.preventDefault();
    
    const accountId = document.getElementById('sender-account').value;
    const recipient = document.getElementById('recipient').value;
    
    if (!accountId) {
        displayResponse('message-response', 'Please select an account', 'error');
        return;
    }
    
    let message = {};
    
    switch(currentMessageType) {
        case 'text':
            const text = document.getElementById('message-text').value.trim();
            if (!text) {
                displayResponse('message-response', 'Please enter a message', 'error');
                return;
            }
            message = { text };
            break;
            
        case 'image':
            const imageUrl = document.getElementById('media-url').value.trim();
            const imageCaption = document.getElementById('media-caption').value.trim();
            if (!imageUrl) {
                displayResponse('message-response', 'Please enter an image URL', 'error');
                return;
            }
            message = { 
                image: { 
                    url: imageUrl,
                    ...(imageCaption && { caption: imageCaption })
                }
            };
            break;
            
        case 'video':
            const videoUrl = document.getElementById('media-url').value.trim();
            const videoCaption = document.getElementById('media-caption').value.trim();
            if (!videoUrl) {
                displayResponse('message-response', 'Please enter a video URL', 'error');
                return;
            }
            message = { 
                video: { 
                    url: videoUrl,
                    ...(videoCaption && { caption: videoCaption })
                }
            };
            break;
            
        case 'audio':
            const audioUrl = document.getElementById('media-url').value.trim();
            if (!audioUrl) {
                displayResponse('message-response', 'Please enter an audio URL', 'error');
                return;
            }
            message = { audio: { url: audioUrl } };
            break;
            
        case 'document':
            const documentUrl = document.getElementById('document-url').value.trim();
            const filename = document.getElementById('document-filename').value.trim();
            const documentCaption = document.getElementById('document-caption').value.trim();
            if (!documentUrl) {
                displayResponse('message-response', 'Please enter a document URL', 'error');
                return;
            }
            message = { 
                document: { 
                    url: documentUrl,
                    ...(filename && { filename }),
                    ...(documentCaption && { caption: documentCaption })
                }
            };
            break;
            
        case 'location':
            const lat = parseFloat(document.getElementById('location-lat').value);
            const lng = parseFloat(document.getElementById('location-lng').value);
            const locationName = document.getElementById('location-name').value.trim();
            const locationAddress = document.getElementById('location-address').value.trim();
            
            if (isNaN(lat) || isNaN(lng)) {
                displayResponse('message-response', 'Please enter valid latitude and longitude', 'error');
                return;
            }
            
            message = { 
                location: { 
                    latitude: lat,
                    longitude: lng,
                    ...(locationName && { name: locationName }),
                    ...(locationAddress && { address: locationAddress })
                }
            };
            break;
    }
    
    const requestBody = {
        to: recipient,
        message: message
    };
    
    showLoading('message-response');
    
    const result = await apiRequest(`/accounts/${accountId}/send-message`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
    });
    
    if (result.success) {
        displayResponse('message-response', result.data, 'success');
        
        // Clear form fields based on message type
        switch(currentMessageType) {
            case 'text':
                document.getElementById('message-text').value = '';
                break;
            case 'image':
            case 'video':
            case 'audio':
                document.getElementById('media-url').value = '';
                document.getElementById('media-caption').value = '';
                break;
            case 'document':
                document.getElementById('document-url').value = '';
                document.getElementById('document-filename').value = '';
                document.getElementById('document-caption').value = '';
                break;
            case 'location':
                document.getElementById('location-lat').value = '';
                document.getElementById('location-lng').value = '';
                document.getElementById('location-name').value = '';
                document.getElementById('location-address').value = '';
                break;
        }
    } else {
        displayResponse('message-response', result.error || 'Failed to send message', 'error');
    }
}

// Quick Actions
async function disconnectAllAccounts() {
    if (!confirm('Are you sure you want to disconnect ALL accounts? This cannot be undone.')) {
        return;
    }
    
    const disconnectPromises = connectedAccounts.map(account => 
        apiRequest(`/accounts/${account.id}/disconnect`, { method: 'DELETE' })
    );
    
    const results = await Promise.all(disconnectPromises);
    const successful = results.filter(r => r.success).length;
    
    alert(`Disconnected ${successful} out of ${connectedAccounts.length} accounts.`);
    loadAccounts();
}

function exportAccountsData() {
    const data = {
        exportDate: new Date().toISOString(),
        accounts: connectedAccounts,
        serverUrl: API_BASE_URL
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `baileys-accounts-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

function clearAllResponses() {
    document.querySelectorAll('.response').forEach(element => {
        element.classList.add('hidden');
        element.innerHTML = '';
    });
}

// Utility Functions
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    element.innerHTML = '🔄 Loading...';
    element.className = 'response';
    element.classList.remove('hidden');
}

function displayResponse(elementId, data, type = '') {
    const element = document.getElementById(elementId);
    element.innerHTML = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
    element.className = `response ${type}`;
    element.classList.remove('hidden');
}

// Auto-refresh accounts every 30 seconds
setInterval(() => {
    if (connectedAccounts.length > 0) {
        loadAccounts();
    }
}, 30000);

// Handle page visibility change to pause/resume auto-refresh
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden, clear intervals
        if (serverHealthInterval) {
            clearInterval(serverHealthInterval);
        }
    } else {
        // Page is visible, restart monitoring
        startHealthMonitoring();
    }
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    alert('An unexpected error occurred. Check the console for details.');
});

// Service worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment to register service worker
        // navigator.serviceWorker.register('/sw.js');
    });
}