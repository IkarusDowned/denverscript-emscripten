import fs from 'fs';
import path from 'path';
import { createSeededGenerator } from '../../util/rand.mjs';

// STX and ETX ASCII characters
const STX = '\x02';
const ETX = '\x03';



function parseArgs() {
    const args = process.argv.slice(2);

    const fileIndex = args.indexOf('--file');
    const seedIndex = args.indexOf('--seed');

    if (fileIndex === -1 || fileIndex + 1 >= args.length) {
        console.error("Usage: node writer.js --file <filename> [--seed <numeric>]");
        process.exit(1);
    }

    const filePath = args[fileIndex + 1];

    let seed = null;
    if (seedIndex !== -1) {
        if (seedIndex + 1 >= args.length || isNaN(Number(args[seedIndex + 1]))) {
            console.error("Error: --seed requires a numeric value.");
            process.exit(1);
        }
        seed = Number(args[seedIndex + 1]);
    }

    return { filePath, seed };
}

function createTimestamp(fileName) {
    return Buffer.from(`${STX}${fileName}:${Date.now()}${ETX}`);
}


function createEod(fileName) {
    return Buffer.from(`${STX}${fileName}:EOD${ETX}`);
}

function main() {

    const { filePath, seed } = parseArgs();
    const random = createSeededGenerator(seed);


    const fileName = path.basename(filePath);
    const stream = fs.createWriteStream(filePath, { flags: 'w' });
    let running = true;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    process.on('SIGINT', () => {
        running = false;
        const eod = createEod(fileName);
        stream.write(eod);
        process.exit(0);
    });


    function generatePacket() {
        const writeType = Math.round(random() % 2);
        const timestamp = Date.now();

        if (writeType === 0) {
            const volume = Math.round(random() * 5000);
            return `${STX}${fileName}:V:${volume}:${timestamp}${ETX}\n`;
        } else {
            const price = random() * 10;
            return `${STX}${fileName}:P:${price.toFixed(2)}:${timestamp}${ETX}\n`;
        }
             
    }
    async function writeLoop() {
        while (running) {
            const packet = generatePacket();
            const ok = stream.write(packet);

            if (!ok) {
                await new Promise(resolve => stream.once('drain', resolve));
            }
            //await new Promise(resolve => setImmediate(resolve));
            await sleep(random() * 2);
        }
    }

    writeLoop();

}

main();