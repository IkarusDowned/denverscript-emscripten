import path from 'path';
import createMultiReaderModule from '../../../build/multifilespikereader.mjs';
import { DelayVisualizer } from '../../visualizer/delayvisualizer.mjs';

const RENDER_INTERVAL = 40;
const POLL_INTERVAL = 10;

function parseArgs() {
    const args = process.argv.slice(2);
    const fileArgIndex = args.indexOf('--files');
    if (fileArgIndex !== -1 && fileArgIndex + 1 < args.length) {
        const rawPaths = args[fileArgIndex + 1]
            .split(',')
            .map(p => path.resolve(process.cwd(), p.trim()));
        return rawPaths;
    } else {
        console.error("Usage: node reader.mjs --files file1,file2,file3");
        process.exit(1);
    }
}


async function main() {
    const argFilePaths = parseArgs();
    const cwd = process.cwd();


    //initialize - module
    const Module = await createMultiReaderModule();

    const mountPath = `/input`;
    Module.FS.mkdir(mountPath);
    Module.FS.mount(Module.FS.filesystems.NODEFS, { root: cwd }, mountPath);


    //Initialize collect path strings
    const mountedPaths = new Module.VectorString();

    argFilePaths.forEach((filepath) => {
        const absoluteFilePath = path.resolve(cwd, filepath);
        if (!absoluteFilePath.startsWith(cwd)) {
            console.error(`Error: File must be inside current directory (${cwd})`);
            process.exit(1);
        }

        const relativePath = path.relative(cwd, absoluteFilePath);
        const wasmFilePath = `${mountPath}/${relativePath.replaceAll('\\', '/')}`;
        mountedPaths.push_back(wasmFilePath);

    });

    const visualizer = new DelayVisualizer(argFilePaths.map(p => path.basename(p)));
    setInterval(() => visualizer.visualize(), RENDER_INTERVAL);


    console.log("starting reader");
    const spikeCallback = (streamName, json) => {
        const spike = JSON.parse(json);
        const createdAt = spike.createdAt;
        const analyzedAt = spike.analyzedAt;

        visualizer.update(streamName, {createdAt, analyzedAt});

    };
    //create reader
    const MultifileSpikeReader = Module.MultifileSpikeReader;
    const reader = new MultifileSpikeReader(mountedPaths, spikeCallback);
    let draining = true;

    reader.start();

    //replace the bottom sections with the commented code to see the application run at full speed
    function drainLoop() {
        if(!draining) return;
        reader.drainSpikes();
    }  
    
    setInterval(drainLoop, POLL_INTERVAL);

    /*
    function drainLoop() {
        if(!draining) return;
        reader.drainSpikes();
        setImmediate(drainLoop)
    }  
    
    setImmediate(drainLoop);
    */

    process.on('SIGINT', () => {
        console.log("\nStopping reader...");
        draining = false;
        //clearInterval(intervalId);
        reader.stop();
        reader.wait();
        console.log("Reader stopped.");
        process.exit(0);
    });

}

await main();
