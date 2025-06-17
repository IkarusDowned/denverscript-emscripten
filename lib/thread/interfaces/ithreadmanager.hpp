#pragma once

#include "thread/interfaces/ithread.hpp"

class IThreadManager
{
public:
        virtual ~IThreadManager()
    {
    }

    virtual void requestStop() = 0;
    virtual void start() = 0;
    virtual void wait() = 0;
};