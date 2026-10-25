/**
 * DigitLab LIS Desktop Bridge / Sync Agent
 * -------------------------------------------------------------
 * Listens on a local TCP socket for incoming blood analyzer data 
 * (Mindray, Sysmex, Erba, Horiba, etc.) via ASTM 1381/1394 protocol.
 * Automatically parses test results and syncs them to the Cloud LIMS.
 */

const net = require('net');
const fs = require('fs');
const path = require('path');

// ASCII Control Characters (ASTM E1381 Standard)
const ENQ = 0x05;
const ACK = 0x06;
const NAK = 0x15;
const EOT = 0x04;
const STX = 0x02;
const ETX = 0x03;
const CR  = 0x0D;
const LF  = 0x0A;

const configPath = path.join(__dirname, 'agent_config.json');
let config = {
    serverUrl: 'http://localhost:5000',
    labCode: 'DEFAULT_LAB',
    apiKey: '',
    machineName: 'Mindray BC-5000',
    listeningPort: 5100,
    protocol: 'ASTM-1394'
};

if (fs.existsSync(configPath)) {
    try {
        config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
    } catch (e) {
        console.error('[CONFIG ERROR] Failed to parse agent_config.json:', e.message);
    }
}

console.log('='.repeat(65));
console.log('🔬 DigitLab LIS Sync Agent (Analyzer Bridge Service)');
console.log('='.repeat(65));
console.log(`📡 Listening for Analyzer on Port : ${config.listeningPort}`);
console.log(`☁️ Cloud Server Target           : ${config.serverUrl}`);
console.log(`🏷️ Lab Code                      : ${config.labCode}`);
console.log(`🤖 Machine Driver                 : ${config.machineName}`);
console.log('='.repeat(65));
console.log('⏳ Waiting for analyzer connection...\n');

function cleanAstmFrame(raw) {
    // Remove STX, ETX, checksum (2 hex chars) and CRLF
    let str = raw.replace(/\x02/g, '').replace(/\x03/g, '');
    // Remove ending checksum pattern e.g., \x0D[0-9A-Fa-f]{2}
    str = str.replace(/\r[0-9A-Fa-f]{2}/g, '');
    return str.trim();
}

function parseAstmData(rawFrames) {
    let sampleBarcode = '';
    let results = [];

    const lines = rawFrames.split(/\r|\n/);
    for (let line of lines) {
        line = cleanAstmFrame(line);
        if (!line) continue;

        // Strip leading frame sequence number if present (e.g., "1H|...", "2P|...", "3O|...")
        if (/^\d[HPORLC]/.test(line)) {
            line = line.substring(1);
        }

        const fields = line.split('|');
        const recordType = fields[0];

        // O = Order / Specimen Record
        if (recordType === 'O') {
            // Fields in ASTM O record:
            // O|sequence|SampleId / Barcode|...
            sampleBarcode = fields[2] ? fields[2].trim() : '';
            // If barcode contains '^', extract the identifier
            if (sampleBarcode.includes('^')) {
                sampleBarcode = sampleBarcode.split('^')[0].trim();
            }
        }
        // R = Result Record
        else if (recordType === 'R') {
            // R|sequence|TestID (e.g. ^^^HGB)|ResultValue|Units|ReferenceRange|AbnormalFlags|...
            const testInfo = fields[2] || '';
            let paramCode = testInfo.includes('^') ? testInfo.split('^').filter(Boolean).pop() : testInfo;
            paramCode = (paramCode || '').trim();

            const resultVal = fields[3] ? fields[3].trim() : '';
            const unit = fields[4] ? fields[4].trim() : '';
            const remarks = fields[6] ? fields[6].trim() : '';

            if (paramCode && resultVal) {
                results.push({
                    parameterCode: paramCode,
                    value: resultVal,
                    unit: unit,
                    remarks: remarks
                });
            }
        }
    }

    return { sampleBarcode, results };
}

async function forwardToCloud(payload) {
    const syncUrl = `${config.serverUrl.replace(/\/$/, '')}/api/machine-interfacing/sync`;
    console.log(`\n🚀 [CLOUD] Sending ${payload.testResults.length} test results for Barcode: ${payload.barcode} to Cloud...`);

    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (config.apiKey) headers['x-lis-key'] = config.apiKey;
        if (config.labCode) headers['x-lab-code'] = config.labCode;

        const res = await fetch(syncUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
            console.log('✅ [SUCCESS] Cloud Sync Completed!');
            console.log(`   Patient Name  : ${data.patientName || 'N/A'}`);
            console.log(`   Case Number   : ${data.caseNumber || 'N/A'}`);
            console.log(`   Barcode       : ${data.barcode}`);
            console.log(`   Synced Params : ${data.syncedParametersCount}`);
            if (data.criticalPanicCount > 0) {
                console.log(`   ⚠️ WARNING: ${data.criticalPanicCount} CRITICAL/PANIC values detected!`);
            }
            console.log('   Report status updated to COMPLETED in Doctor / Lab Portal.\n');
        } else {
            console.error('❌ [CLOUD ERROR]', data.message || res.statusText);
        }
    } catch (err) {
        console.error('❌ [NETWORK ERROR] Failed to reach Cloud Server:', err.message);
        console.error('   Please ensure backend is running at ' + config.serverUrl);
    }
}

const server = net.createServer((socket) => {
    const remoteAddr = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`\n🔌 [CONNECT] Analyzer connected from ${remoteAddr}`);

    let rawBuffer = '';

    socket.on('data', async (chunk) => {
        // ASTM Handshake Handling
        for (let i = 0; i < chunk.length; i++) {
            const byte = chunk[i];

            // 1. ENQ received from analyzer -> ACK back
            if (byte === ENQ) {
                console.log('📥 [ASTM] Received ENQ (Enquiry). Sending ACK...');
                socket.write(Buffer.from([ACK]));
                rawBuffer = '';
                continue;
            }

            // 2. EOT received -> transmission finished
            if (byte === EOT) {
                console.log('📥 [ASTM] Received EOT (End of Transmission). Processing data...');
                const { sampleBarcode, results } = parseAstmData(rawBuffer);

                if (!sampleBarcode) {
                    console.warn('⚠️ [ASTM] Warning: No Barcode / Sample ID detected in ASTM order record.');
                }

                console.log(`📊 [ASTM] Parsed: Barcode='${sampleBarcode}', Parameters Count=${results.length}`);
                for (const r of results) {
                    console.log(`   • ${r.parameterCode.padEnd(10)}: ${r.value.padEnd(8)} ${r.unit}`);
                }

                if (sampleBarcode && results.length > 0) {
                    await forwardToCloud({
                        apiKey: config.apiKey,
                        labCode: config.labCode,
                        machineName: config.machineName,
                        protocol: config.protocol,
                        barcode: sampleBarcode,
                        testedAt: new Date().toISOString(),
                        testResults: results,
                        rawData: rawBuffer
                    });
                } else {
                    console.warn('⚠️ [SKIP] Insufficient data to forward to Cloud.');
                }

                rawBuffer = '';
                continue;
            }
        }

        // Collect message text
        const text = chunk.toString('ascii');
        rawBuffer += text;

        // If chunk has ASTM frames, acknowledge them
        if (chunk.includes(STX) || chunk.includes(CR) || chunk.includes(LF)) {
            socket.write(Buffer.from([ACK]));
        }
    });

    socket.on('end', () => {
        console.log(`🔌 [DISCONNECT] Analyzer disconnected: ${remoteAddr}`);
    });

    socket.on('error', (err) => {
        console.error(`⚠️ [SOCKET ERROR] ${err.message}`);
    });
});

server.listen(config.listeningPort, '0.0.0.0', () => {
    console.log(`🚀 LIS Agent ready and listening on all interfaces (Port ${config.listeningPort})`);
});
