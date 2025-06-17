#pragma once
#include <vector>

class IPacketReader
{
public:
    virtual ~IPacketReader() {}
    virtual int initialize() = 0;
    virtual int readPacket(std::vector<char> &outPacket) = 0;
};