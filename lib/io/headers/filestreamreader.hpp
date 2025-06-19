#pragma once
#include <string>
#include <iostream>
#include <fstream>
#include <vector>
#include "io/interfaces/istreamreader.hpp"

class FileStreamReader : public IStreamReader
{
private:
    const std::string filepath;
    const int maxReadAmount = 64 * 1024;
    std::ifstream infileStream;
    std::vector<char> buffer;

public:
    FileStreamReader(const std::string &filepath) : filepath(filepath), buffer(maxReadAmount) {}

    virtual int initialize() override
    {
        infileStream.open(filepath, std::ios::binary);
        return infileStream.is_open();
    }

    virtual int readBytes() override
    {
        if (!infileStream.good())
        {
            // Re-seek to current to clear EOF
            infileStream.clear();
            infileStream.seekg(0, std::ios::cur);
        }

        infileStream.read(buffer.data(), buffer.size());
        return infileStream.gcount();
    }

    virtual const std::vector<char> &getByteBuffer() override
    {
        return this->buffer;
    }
};