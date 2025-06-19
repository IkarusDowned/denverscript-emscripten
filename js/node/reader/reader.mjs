import { stat, createReadStream } from 'fs';
import process from 'process';
import { DelayVisualizer } from '../../visualizer/delayvisualizer.mjs';
import Euclidean from './algorithm/euclidean.mjs';

const STX = '\x02';
const ETX = '\x03';
const POLL_INTERVAL_MS = 1;
const RENDER_INTERVAL = 40;
const CALCULATION_INTERNVAL = 25;
const PACKET_BUFFER_SIZE = 1e7;

// Parse CLI args
const args = process.argv.slice(2);
const filesFlagIndex = args.indexOf('--files');
if (filesFlagIndex === -1 || !args[filesFlagIndex + 1]) {
  console.error('Usage: node reader.mjs --files file1.txt,file2.txt');
  process.exit(1);
}
const files = args[filesFlagIndex + 1].split(',');



class FileSpikeReader {
  constructor(file) {
    this.file = file;
    this.buffer = '';
    this.lastSize = 0;
    this.renderQueue = [];
    this.euclideanCalculator = new Euclidean(PACKET_BUFFER_SIZE, CALCULATION_INTERNVAL);
  }

  async poll() {
    stat(this.file, (err, stats) => {
      if (err || stats.size <= this.lastSize) return;

      const stream = createReadStream(this.file, {
        encoding: 'utf-8',
        start: this.lastSize,
        end: stats.size - 1
      });

      stream.on('data', chunk => {
        this.buffer += chunk;
        let start, end;
        while ((start = this.buffer.indexOf(STX)) !== -1 && (end = this.buffer.indexOf(ETX, start)) !== -1) {
          const packet = this.buffer.substring(start + 1, end);
          this.buffer = this.buffer.substring(end + 1);
          this.processPacket(packet);
        }
      });

      stream.on('end', () => {
        this.lastSize = stats.size;
      });
    });
  }

  processPacket(packet) {
    const [filename, type, valueStr, timestamp] = packet.split(':');
    if (!timestamp) return;
    

    if(type === 'V')
    {
      this.euclideanCalculator.onNewTick({type: 'volume', value: parseInt(valueStr)});

    } 
    else if(type === 'P')
    {
      this.euclideanCalculator.onNewTick({type: 'price', value: parseFloat(valueStr)});
    }

    if(this.euclideanCalculator.needsDistanceAnalysisCheck())
    {
      const avgDistance = this.euclideanCalculator.getAverageDistance();
      const createdAt = Number(timestamp);
      const analyzedAt = Date.now();

      this.renderQueue.push({ createdAt, analyzedAt });
    }
  }
}


const visualizer = new DelayVisualizer(files);
setInterval(() => {
  readers.forEach(reader => {
    while (reader.renderQueue.length > 0) {
      const { createdAt, analyzedAt } = reader.renderQueue.shift();
      visualizer.update(reader.file, { createdAt, analyzedAt });
    }
  });
  visualizer.visualize();
}, RENDER_INTERVAL);

// Start polling each file
const readers = files.map(f => new FileSpikeReader(f));

const intervals = readers.map(reader => setInterval(() => reader.poll(), POLL_INTERVAL_MS));

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  intervals.forEach(clearInterval);
  process.exit(0);
});

//a note about the below code.
//ideally, we wnat to poll the files as fast as possible. This is doable in the C++ version, but 
//in Node 20, this causes a corruption of the read data - its too fast for Node to cope.
//Hopefully in future versions, or on different machines, this issue will be fixed 
/*
let isRunning = true;

function pollContinuously(reader) {
  if (!isRunning) return;
  reader.poll();
  setImmediate(() => pollContinuously(reader));
}

readers.forEach(reader => pollContinuously(reader));

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  isRunning = false;
  process.exit(0);
});
*/


