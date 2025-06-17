#pragma once
#include <vector>
class IStreamReader
{
public:
    virtual ~IStreamReader() {}
    virtual int initialize() = 0;
    virtual int readBytes() = 0;
    virtual const std::vector<char> &getByteBuffer() = 0;
};