#pragma once
#include <vector>
#include <iostream>
#include "packet/headers/asciipacketconstants.hpp"
#include "packet/interfaces/ipacketreader.hpp"
#include "io/interfaces/istreamreader.hpp"

class AsciiPacketReader : public IPacketReader
{
private:
    IStreamReader &streamReader;
    std::vector<char> packetBuffer;
    int readOffset = 0;
    inline int getIndexOfEndOfPacket()
    {
        for (size_t i = readOffset; i < packetBuffer.size(); ++i)
        {
            if (packetBuffer[i] == PACKET_END)
            {
                return static_cast<int>(i);
            }
        }
        return -1; // no full packet found yet
    }

    int getPacketFromExistingBuffer(std::vector<char> &outPacket)
    {
        const int endOfAPacket = getIndexOfEndOfPacket();
        if (endOfAPacket > readOffset)
        {
            if (packetBuffer[readOffset] != PACKET_START) {
                ++readOffset;
                return 0;
            }
            const int packetStart = readOffset + 1;
            const int packetEnd = endOfAPacket;
            if (packetEnd > packetBuffer.size())
            {
                std::cout << "Safety Check is failing!!" << std::endl;
                return 0; // safety check
            }
            outPacket.assign(packetBuffer.begin() + packetStart,
                             packetBuffer.begin() + packetEnd);
            readOffset = endOfAPacket + 1;

            // Compact buffer
            if (readOffset > 1024 && readOffset > packetBuffer.size() / 2)
            {
                packetBuffer.erase(packetBuffer.begin(), packetBuffer.begin() + readOffset);
                readOffset = 0;
            }
            return packetEnd - packetStart;
        }

        return 0;
    }

public:
    explicit AsciiPacketReader(IStreamReader &streamReader) : streamReader(streamReader) {}
    virtual ~AsciiPacketReader() {}
    virtual int initialize() override
    {
        return streamReader.initialize();
    }
    virtual int readPacket(std::vector<char> &outPacket) override
    {
        // attempt to read from the existing buffer
        int bytesRead = getPacketFromExistingBuffer(outPacket);
        if (bytesRead > 0)
            return bytesRead;                 // exit out since we have data in the buffer
        bytesRead = streamReader.readBytes(); // see if there is any new data in the buffer
        auto rawBytesIterator = streamReader.getByteBuffer().begin();
        packetBuffer.insert(packetBuffer.end(), rawBytesIterator, rawBytesIterator + bytesRead);
        return getPacketFromExistingBuffer(outPacket); // re-fetch to see if there is a new packet
    }
};
