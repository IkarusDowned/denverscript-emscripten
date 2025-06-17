#pragma once

#include <thread/interfaces/ithreadmanager.hpp>

class IThread
{
public:
    virtual ~IThread() {}
    virtual void run() = 0;
    virtual void join() = 0;
    virtual void requestStop() = 0;
};