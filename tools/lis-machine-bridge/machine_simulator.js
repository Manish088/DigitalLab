/**
 * Blood Analyzer Machine Simulator (ASTM Protocol)
 * -------------------------------------------------------------
 * Simulates a high-throughput hematology analyzer (e.g., Mindray BC-5000 / Sysmex XN)
 * running a blood sample test and transmitting results via ASTM 1381/1394.
 * 
 * Usage:
 *   node machine_simulator.js [barcode] [preset]
 * 
 * Examples:
 *   node machine_simulator.js 2600101 normal
 *   node machine_simulator.js 2600101 anemia
 *   node machine_simulator.js 2600101 infection
 *   node machine_simulator.js 2600101 platelet_low
 */

const net = require('net');

const ENQ = 0x05;
const ACK = 0x06;
const EOT = 0x04;
const STX = 0x02;
const ETX = 0x03;
const CR  = 0x0D;
const LF  = 0x0A;

const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 5100;

// Command line parameters
const args = process.argv.slice(2);
const barcode = args[0] || '2600101';
const preset = (args[1] || 'normal').toLowerCase();

console.log('='.repeat(65));
console.log('🤖 BLOOD ANALYZER MACHINE SIMULATOR (MINDRAY BC-5000)');
console.log('='.repeat(65));
console.log(`🎯 Connecting to LIS Agent at : ${TARGET_HOST}:${TARGET_PORT}`);
console.log(`🧪 Sample Barcode Label       : ${barcode}`);
console.log(`📋 Test Profile Preset        : ${preset.toUpperCase()}`);
console.log('='.repeat(65));

// Define test presets
function getResultsForPreset(type) {
    if (type === 'anemia') {
        return [
            { code: 'HGB', val: '5.2', unit: 'g/dL', flag: 'L' },     // Panic Low
            { code: 'WBC', val: '6800', unit: '/cumm', flag: 'N' },
            { code: 'PLT', val: '210000', unit: '/cumm', flag: 'N' },
            { code: 'RBC', val: '2.10', unit: 'mil/cumm', flag: 'L' }, // Low
            { code: 'PCV', val: '18.5', unit: '%', flag: 'L' },
            { code: 'MCV', val: '65.0', unit: 'fL', flag: 'L' },
            { code: 'MCH', val: '20.1', unit: 'pg', flag: 'L' },
            { code: 'MCHC', val: '28.5', unit: 'g/dL', flag: 'L' },
            { code: 'NEUT', val: '65.0', unit: '%', flag: 'N' },
            { code: 'LYMPH', val: '28.0', unit: '%', flag: 'N' },
            { code: 'MONO', val: '4.0', unit: '%', flag: 'N' },
            { code: 'EOS', val: '2.0', unit: '%', flag: 'N' },
            { code: 'BASO', val: '1.0', unit: '%', flag: 'N' }
        ];
    } else if (type === 'infection') {
        return [
            { code: 'HGB', val: '12.8', unit: 'g/dL', flag: 'N' },
            { code: 'WBC', val: '28500', unit: '/cumm', flag: 'H' },  // High infection / Sepsis
            { code: 'PLT', val: '380000', unit: '/cumm', flag: 'N' },
            { code: 'RBC', val: '4.30', unit: 'mil/cumm', flag: 'N' },
            { code: 'PCV', val: '39.0', unit: '%', flag: 'N' },
            { code: 'MCV', val: '86.0', unit: 'fL', flag: 'N' },
            { code: 'MCH', val: '29.0', unit: 'pg', flag: 'N' },
            { code: 'MCHC', val: '33.0', unit: 'g/dL', flag: 'N' },
            { code: 'NEUT', val: '88.0', unit: '%', flag: 'H' },     // High Neutrophils
            { code: 'LYMPH', val: '8.0', unit: '%', flag: 'L' },
            { code: 'MONO', val: '3.0', unit: '%', flag: 'N' },
            { code: 'EOS', val: '1.0', unit: '%', flag: 'N' },
            { code: 'BASO', val: '0.0', unit: '%', flag: 'N' }
        ];
    } else if (type === 'platelet_low' || type === 'dengue') {
        return [
            { code: 'HGB', val: '13.5', unit: 'g/dL', flag: 'N' },
            { code: 'WBC', val: '3900', unit: '/cumm', flag: 'L' },
            { code: 'PLT', val: '18000', unit: '/cumm', flag: 'L' },  // Critical Low Platelets (< 20k)
            { code: 'RBC', val: '4.60', unit: 'mil/cumm', flag: 'N' },
            { code: 'PCV', val: '41.0', unit: '%', flag: 'N' },
            { code: 'MCV', val: '88.0', unit: 'fL', flag: 'N' },
            { code: 'MCH', val: '30.0', unit: 'pg', flag: 'N' },
            { code: 'MCHC', val: '34.0', unit: 'g/dL', flag: 'N' },
            { code: 'NEUT', val: '58.0', unit: '%', flag: 'N' },
            { code: 'LYMPH', val: '35.0', unit: '%', flag: 'N' },
            { code: 'MONO', val: '5.0', unit: '%', flag: 'N' },
            { code: 'EOS', val: '2.0', unit: '%', flag: 'N' },
            { code: 'BASO', val: '0.0', unit: '%', flag: 'N' }
        ];
    } else {
        // Standard Normal CBC
        return [
            { code: 'HGB', val: '14.2', unit: 'g/dL', flag: 'N' },
            { code: 'WBC', val: '7400', unit: '/cumm', flag: 'N' },
            { code: 'PLT', val: '245000', unit: '/cumm', flag: 'N' },
            { code: 'RBC', val: '4.85', unit: 'mil/cumm', flag: 'N' },
            { code: 'PCV', val: '42.5', unit: '%', flag: 'N' },
            { code: 'MCV', val: '88.2', unit: 'fL', flag: 'N' },
            { code: 'MCH', val: '29.4', unit: 'pg', flag: 'N' },
            { code: 'MCHC', val: '33.5', unit: 'g/dL', flag: 'N' },
            { code: 'NEUT', val: '62.0', unit: '%', flag: 'N' },
            { code: 'LYMPH', val: '30.0', unit: '%', flag: 'N' },
            { code: 'MONO', val: '5.0', unit: '%', flag: 'N' },
            { code: 'EOS', val: '2.0', unit: '%', flag: 'N' },
            { code: 'BASO', val: '1.0', unit: '%', flag: 'N' }
        ];
    }
}

// Build standard ASTM 1394 frames
function buildAstmFrames(sampleBarcode, testResults) {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const frames = [];

    // Header record
    frames.push(`H|\\^&|||Mindray^BC-5000^01.00||||||||${timestamp}`);
    // Patient record
    frames.push(`P|1|||||||U`);
    // Order / Specimen record
    frames.push(`O|1|${sampleBarcode}||^^^CBC|||||||||||WholeBlood`);

    // Result records
    testResults.forEach((res, index) => {
        frames.push(`R|${index + 1}|^^^${res.code}|${res.val}|${res.unit}||${res.flag}||F`);
    });

    // Terminator record
    frames.push(`L|1|N`);

    return frames;
}

// Helper to compute ASTM checksum: (Sum of ASCII codes from STX to ETX) mod 256
function formatAstmFrame(seq, content) {
    const frameBody = `${seq % 8}${content}\r\x03`;
    let sum = 0;
    for (let i = 0; i < frameBody.length; i++) {
        sum += frameBody.charCodeAt(i);
    }
    const checksum = (sum % 256).toString(16).toUpperCase().padStart(2, '0');
    return `\x02${frameBody}${checksum}\r\n`;
}

const client = new net.Socket();

client.connect(TARGET_PORT, TARGET_HOST, () => {
    console.log(`🔌 [CONNECTED] Connected to LIS Agent.`);
    console.log(`📤 [ASTM] Sending ENQ (Enquiry: Machine is ready to send data)...`);
    client.write(Buffer.from([ENQ]));
});

let frameIndex = 0;
const results = getResultsForPreset(preset);
const rawFrames = buildAstmFrames(barcode, results);

client.on('data', (data) => {
    // If agent sent ACK
    if (data.includes(ACK)) {
        if (frameIndex < rawFrames.length) {
            const frameContent = rawFrames[frameIndex];
            const formatted = formatAstmFrame(frameIndex + 1, frameContent);
            console.log(`📤 [FRAME ${frameIndex + 1}/${rawFrames.length}] ${frameContent}`);
            client.write(formatted);
            frameIndex++;
        } else {
            // All frames sent -> send EOT (End of Transmission)
            console.log(`📤 [ASTM] All frames sent. Sending EOT (End of Transmission)...`);
            client.write(Buffer.from([EOT]));
            setTimeout(() => {
                console.log(`\n🎉 [COMPLETE] Test run transmitted successfully to LIS Agent!`);
                client.destroy();
                process.exit(0);
            }, 300);
        }
    } else {
        console.log(`📥 Received from agent:`, data.toString());
    }
});

client.on('error', (err) => {
    console.error(`❌ [CONNECTION FAILED] ${err.message}`);
    console.error(`👉 Ensure the LIS Agent is running first! (node lis_agent.js)`);
    process.exit(1);
});
