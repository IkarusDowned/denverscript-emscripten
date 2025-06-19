#pragma once
#include <string>
#include <vector>
#include <mutex>
#include <thread>
#include <atomic>
#include <queue>
#include <condition_variable>
#include <functional>
#include <emscripten/val.h>
#include "thread/headers/threadmanager.hpp"
#include "thread/interfaces/ithread.hpp"
#include "io/headers/filestreamreader.hpp"
#include "packet/headers/asciipacketreader.hpp"
#include "euclidean.hpp"

const int MAX_PACKET_SIZE = 1000;

class MultifileSpikeReader;
class PacketPipe;

struct JsonSpike
{
    std::string streamName;
    std::string json; // a JSON string
};

class FileReaderThread : public IThread
{
private:
    std::atomic<bool> isRunning;
    std::thread thread;
    std::vector<std::unique_ptr<FileStreamReader> > readers;
    std::vector<std::unique_ptr<AsciiPacketReader> > packetReaders;
    std::vector<std::vector<char>> dataBuffers;
    std::vector<std::unique_ptr<PacketPipe> > packetPipes;
    int initialize();
    
public:
    explicit FileReaderThread(const std::vector<std::string> &filePaths);
    virtual ~FileReaderThread();
    
    virtual void run() override;

    virtual void join() override;
    virtual void requestStop() override;

    inline PacketPipe& getPipe(int index) { return *packetPipes[index]; }
};

class PacketPipe
{
private:
    std::mutex mutex;
    std::queue<std::string> queue;
public:
    PacketPipe() {}
    ~PacketPipe() {}
    void enqueue(const std::string &packet);
    std::string dequeue();
};

class ProducerThread : public IThread
{
private:
    std::thread thread;
    std::atomic<bool> isStopRequested = false;
    
    
    Euclidean euclidean;

    void update(const std::string &packet);
    PacketPipe& pipe;
    MultifileSpikeReader& readerManager;

public:
    explicit ProducerThread(PacketPipe& pipe, MultifileSpikeReader& readerManager);
    virtual ~ProducerThread(){}
    virtual void run() override;

    virtual void join() override;
    virtual void requestStop() override;
};

class MultifileSpikeReader
{

private:
    std::unique_ptr<ThreadManager> threadManager;
    std::vector<std::unique_ptr<IThread>> threads;
    std::atomic<bool> running;
    std::mutex mutex;
    std::queue<JsonSpike> spikeQueue;
    void createThreads(const std::vector<std::string> &filePaths);
    emscripten::val jsCallback;

    IThread *fileReader;

public:
    explicit MultifileSpikeReader(const std::vector<std::string> &filePaths, emscripten::val callback);
    ~MultifileSpikeReader();

    void stop();
    void wait();
    void start();
    bool isRunning();
    void produceSpike(const JsonSpike &spike);
    void drainSpikes();
};
