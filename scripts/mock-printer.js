const net = require('net');
const fs = require('fs');
const path = require('path');

const PORT = 9100;
const HOST = '0.0.0.0';
const LOG_FILE = path.join(__dirname, '..', 'receipt_preview.txt');

// Clear log file on startup
fs.writeFileSync(LOG_FILE, '--- PRINTER LOG START ---\n\n');

const server = net.createServer((socket) => {
    console.log('--- MOCK PRINTER CONNECTED ---');
    
    socket.on('data', (data) => {
        const cleanData = data.toString().replace(/[\x00-\x1F\x7F-\x9F]/g, (match) => {
            return match === '\n' ? '\n' : '.';
        });
        
        console.log('Received Print Data:', cleanData);
        
        // Save to file for user download
        fs.appendFileSync(LOG_FILE, `\n[${new Date().toLocaleTimeString()}] RECEIPT:\n${cleanData}\n${'='.repeat(48)}\n`);
    });

    socket.on('end', () => {
        console.log('--- MOCK PRINTER DISCONNECTED ---');
    });

    socket.on('error', (err) => {
        console.error('Socket Error:', err);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m Mock Printer is RUNNING on ${HOST}:${PORT}`);
    console.log(`Logs saving to: \x1b[36m${LOG_FILE}\x1b[0m`);
});
