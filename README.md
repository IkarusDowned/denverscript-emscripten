# About
This project is for the DenverScript talk on June 24, 2025.
The objective is to show that in specific cases, such as high-frequency data streaming, JS / Node's event loop can cause unpredictable results in the main thread.

This specific use case is modeled on my work with creating high-frequency stock feed and analysis systems from 2007. The general basis is a stream of packets, defined by the stock exchanges, and doing some level of rapid work on them.
This is an EXAMPLE, and not production ready, nor does it attempt to highlight every possible use case.

The file writer simulates a high-frequency lossess packet stream.
The reader takes in multiple file streams and processes the average Euclidean distance of new Price/Volume "ticks" against the stored ticks at set intervals. 
Each file has its own line, and the delay is shown in a line of '=', where each '=' indicates a 5ms delay.

Example:
<pre>Sun Apr 13 2025 09:29:06 GMT-0600 (Mountain Daylight Time) 
[output/test1.dat]: = 
[output/test2.dat]: = 
[output/test3.dat]: ========= </pre>


### Packet Definition
A packet is defined as a string of ASCII data which starts with character code STX and ends with ETX
Ex:
`\x02this is packet data!\x03`

within each of these packets is a "coded" ticker

### Ticker format
There are 3 types of tickers. 
1. EOD - End Of Day
Indicates the stream is done for the day.
Format: `<filename>:EOD`
Ex: `output1.dat:EOD`

2. Volume - Trading volume 
Indicates the trading volume at a given time. Values are whole numbers
Ex: `<filename>:V:<volume>:<creation time ms>`
Ex: `test1.dat:V:745:1744558144450`

3. Price - Current Price
Indicates the price at a given time. Values are decimals
Ex: `<filename>:P:<price>:<creation time ms>`
Ex: `test1.dat:P:3.14:1744558144450`

## Requirements
1. Node version 20 or higher
2. Docker version 28 or better
3. The file writer will create files rapidly (up to a 150mb file in under 3 minutes!) so be prepared to have plenty of disc space if you intend to run the file writer for an extended period of time
4. A system capable of using pthreads

## How to build

### Build the Emscripten JS binding
**One-time step:** create a folder `build/`

`docker pull emscripten/emsdk`
on mac:
`docker pull emscripten/emsdk:4.0.6-arm64`

then
Windows:
`MSYS_NO_PATHCONV=1 docker run --rm -v $(pwd):/src -w /src emscripten/emsdk em++ -v filereader/multifilespikereader.cpp filereader/bindings.cpp -o build/multifilespikereader.mjs -I filereader/headers -I lib -s "EXPORTED_RUNTIME_METHODS=['FS','NODEFS']" -s USE_PTHREADS=1 -s PTHREAD_POOL_SIZE=6 -s MODULARIZE=1 -s EXPORT_NAME="createMultiReaderModule" -s ALLOW_MEMORY_GROWTH=1 -s FORCE_FILESYSTEM=1 -O3 -std=c++20 -pthread --bind --no-entry -lnodefs.js`

Mac with ARM chips:
`docker run --rm -v $(pwd):/src -w /src emscripten/emsdk:4.0.6 em++ -v filereader/multifilespikereader.cpp filereader/bindings.cpp -o build/multifilespikereader.mjs -I filereader/headers -I lib -s "EXPORTED_RUNTIME_METHODS=['FS','NODEFS']" -s USE_PTHREADS=1 -s PTHREAD_POOL_SIZE=6 -s MODULARIZE=1 -s EXPORT_NAME="createMultiReaderModule" -s ALLOW_MEMORY_GROWTH=1 -s FORCE_FILESYSTEM=1 -O3 -std=c++20 -pthread --bind --no-entry -lnodefs.js`


## How to run
### Pure JS 
`bash runNode_promise.sh <file count>`

### Thread-based
`bash runNode_thread.sh <file count>`

## Addendum
- This code is provided as is. Please see the license for more details
- At the time of writing this, Emscripten does not have fully multithreaded or system-call capable functionality for the filesystem. It relies on Node's filesystem which is single-threaded and using it in a multi-threaded manner leads to unexpected behaviour. As a result, the emscripten version uses a single thread to read from multiple files and "pipes" them to the packet reeading threads to simulate multiple file reads going on in parallel. In the future, WASMFS should become the standard filesystem for emscripten and allow for faster native-level file reading.
