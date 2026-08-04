const fs = require('fs');
const path = require('path');

const replacements = [
  // General Terms
  { match: /Guardian Protocols/g, replace: 'Security' },
  { match: /Neural Guard/g, replace: 'Account Protection' },
  { match: /Identity Matrix/g, replace: 'Personal Information' },
  { match: /Aura Core/g, replace: 'Profile' },
  { match: /Neural Key/g, replace: 'Password' },
  { match: /Quantum Encryption/g, replace: 'End-to-End Encryption' },
  { match: /Active Resonance Nodes/g, replace: 'Active Devices' },
  { match: /Vision Grid Desktop/g, replace: 'Chrome on Windows' },
  { match: /Neural Interface/g, replace: 'This Device' },
  { match: /Synchronization Pulse/g, replace: 'Sync' },
  { match: /Environment Scanned/g, replace: 'Your account is secure' },
  { match: /Quantum Leak/g, replace: 'No security issues detected' },
  { match: /Device Relay/g, replace: 'Connected Device' },
  { match: /Signal Stable/g, replace: 'Connected' },
  { match: /Resonance Activity/g, replace: 'Recent Activity' },
  { match: /Hyper Protection/g, replace: 'Enhanced Security' },
  { match: /Core Identity/g, replace: 'Account Details' },
  { match: /Resonance Feed/g, replace: 'Activity Feed' },
  { match: /Neural Vault/g, replace: 'Private Vault' },

  // Buttons
  { match: /Initiate Pairing/g, replace: 'Link Device' },
  { match: /Launch Resonance/g, replace: 'Start Call' },
  { match: /Revoke Node/g, replace: 'Remove Device' },
  { match: /Initialize Vault/g, replace: 'Open Vault' },
  { match: /Reset Neural Key/g, replace: 'Change Password' },

  // Empty States
  { match: /No Resonance Detected/g, replace: 'Nothing here yet.\nStart by creating your first post.' },
  { match: /Your Neural Feed is Empty/g, replace: 'Your feed is empty.\nFollow people to see their posts.' },

  // Error Messages
  { match: /Synchronization Failure/g, replace: "Couldn't sync your data.\nPlease try again." },
  { match: /Neural Authentication Error/g, replace: "Sign in failed.\nPlease try again." },
  { match: /Quantum Communication Interrupted/g, replace: "Connection lost.\nCheck your internet and try again." },

  // Toasts
  { match: /Password updated successfully\./g, replace: 'Password updated successfully.' },
  { match: /Message sent\./g, replace: 'Message sent.' },
  { match: /Couldn't upload your photo\.\nPlease try again\./g, replace: "Couldn't upload your photo.\nPlease try again." },
  { match: /Device removed\./g, replace: 'Device removed.' },
  { match: /Settings saved\./g, replace: 'Settings saved.' },

  // Additional "Neural" UI Strings found
  { match: /Neural Nodes/g, replace: 'Active Devices' }, // based on Context
  { match: /Neural Performance/g, replace: 'Performance' },
  { match: /Neural Sync Timeout/g, replace: 'Sync Timeout' },
  { match: /NEURAL SYNC:/g, replace: 'SYNC:' },
  { match: /Neural Knowledge Test/g, replace: 'Knowledge Test' },
  { match: /NEURAL SYNCED/g, replace: 'SYNCED' },
  { match: /Neural Image Reconstructor/g, replace: 'Image Editor' },
  { match: /Neural Admin Interface/g, replace: 'Admin Interface' },
  { match: /Neural Payment/gi, replace: 'Payment' },
  { match: /Neural Node Manifested/g, replace: 'Account created' },
  { match: /Neural Overload/g, replace: 'Storage Full' },
  { match: /Neural Handle/gi, replace: 'Username' },
  { match: /Neural Network Lag/g, replace: 'Connection Lag' },
  { match: /Neural Sync Denied/g, replace: 'Sync Denied' },
  { match: /Neural Pruning/g, replace: 'Storage Cleanup' },
  
  // App.tsx specific ones
  { match: /Neural Stream \| Home/g, replace: 'Home' },
  { match: /Neural Streams \| Videos/g, replace: 'Videos' },
  { match: /Neural Dashboard \| Stats/g, replace: 'Stats' },
  { match: /Neural Resonance Social Matrix/g, replace: 'Aeirmist' },
  { match: /Neural Entity/g, replace: 'User' },
  { match: /Restoring neural networks\.\.\./g, replace: 'Loading your feed...' },
  { match: /Initializing Neural Interface v4\.8/g, replace: 'Setting things up...' },
  { match: /Exchanging Quantum Keys\.\.\./g, replace: 'Linking device...' },
  { match: /Processing Neural Signal\.\.\./g, replace: 'Processing upload...' },
  { match: /Central Neural Ring/g, replace: 'Navigation Ring' },

  // Quantum UI Strings
  { match: /Quantum Silence/g, replace: 'Quiet Mode' },
  { match: /Neural Quantum Matrix/g, replace: 'Featured Feed' },
  { match: /8K QUANTUM FEED/g, replace: '8K QUALITY' },
  { match: /Quantum Tunneled/g, replace: 'End-to-End Encrypted' },
  { match: /quantum moderation core/g, replace: 'moderation team' },

  // Protocol UI Strings
  { match: /Security Protocol/g, replace: 'Security' },
  { match: /Unified Google\/Apple Pay Device Protocol/g, replace: 'Google/Apple Pay Checkout' },
  { match: /Email Protocols/g, replace: 'Email Notifications' },
  { match: /Luminance protocol configuration/g, replace: 'Brightness settings' },
  { match: /Email update protocol/g, replace: 'Email update' },
  { match: /security history protocol/g, replace: 'security history' },
  { match: /Messaging protocols/g, replace: 'Messaging settings' },
  { match: /Configure (.*?) protocol/g, replace: 'Configure $1 settings' },
  { match: /Auto-Archive Protocol/g, replace: 'Auto-Archive' },
  { match: /zero-knowledge protocols/g, replace: 'end-to-end encryption' },
  { match: /Interactive Protocols/g, replace: 'Interactive Settings' },
  { match: /Input Protocols/g, replace: 'Input Settings' },
  { match: /Terminal Protocols/g, replace: 'Account Deletion' },
  { match: /Stealth Protocols/g, replace: 'Privacy Lock' },
  { match: /storage protocols/g, replace: 'storage' },
  { match: /high-security protocols/g, replace: 'high-security settings' },
  { match: /Privacy Protocols/g, replace: 'Privacy Settings' },
  { match: /compression protocols/g, replace: 'compression' },
  { match: /ACCOUNT PROTOCOL UPDATED/g, replace: 'ACCOUNT TYPE UPDATED' },
  { match: /channel protocol/g, replace: 'channel type' },
  { match: /creator protocol swap/g, replace: 'creator mode activation' },
  { match: /Account Type protocol Picker/g, replace: 'Account Type Picker' },
  { match: /Profile Protocol Swap/g, replace: 'Change Profile Type' },
  { match: /Economic protocols/g, replace: 'Economic guidelines' },
  { match: /Safety Protocol/g, replace: 'Safety Guidelines' },
  { match: /restricted by security protocol/g, replace: 'restricted for security reasons' },
  { match: /Neural Communication Protocol/g, replace: 'Communication Platform' },
  { match: /credentials protocol/g, replace: 'password' },
  { match: /dynamic atmospheric protocols/g, replace: 'themes' },
  { match: /Purge protocol/gi, replace: 'Deletion process' },

  // Vault
  { match: /Restore Thread/g, replace: 'Unarchive Chat' },
  { match: /Archive Thread/g, replace: 'Archive Chat' },

  // Specific phrases
  { match: /Neural Uplink: Stable/g, replace: 'Connected' },
  { match: /Protocol v4\.2\.0/g, replace: 'Version 4.2.0' },

];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const r of replacements) {
        content = content.replace(r.match, r.replace);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory('./src');
