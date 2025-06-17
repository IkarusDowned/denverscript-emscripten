#pragma once
#include <utility>
#include <iostream>
#include <cmath>
#include <container/circularbuffer.hpp>

#define DEFAULT_BUFFER_SIZE 10000000
#define DEFAULT_CHECK_THRESHOLD 10

class Euclidean
{
private:
    CircularBuffer<std::pair<float, long>> buffer;
    const int checkThreshold;
    float lastPrice;
    long lastVolume;
    long tickCount;
    long ticksOnLastCheck;

    inline bool shouldCreateNewTick()
    {
        return this->lastPrice > 0 && this->lastVolume > 0;
    }

    inline void enqueTick()
    {
        if (this->shouldCreateNewTick())
        {
            std::pair<float, long> compositeValue(this->lastPrice, this->lastVolume);
            this->buffer.enqueue(compositeValue);
            ++(this->tickCount);
        }
    }

public:
    explicit Euclidean(unsigned int bufferSize = DEFAULT_BUFFER_SIZE, int checkThreshold = DEFAULT_CHECK_THRESHOLD)
        : buffer(bufferSize), checkThreshold(checkThreshold), lastPrice(-1), lastVolume(-1), tickCount(0), ticksOnLastCheck(0)
    {
    }

    void onNewTick(float value)
    {
        this->lastPrice = value;
        this->enqueTick();
    }

    void onNewTick(long value)
    {
        this->lastVolume = value;
        this->enqueTick();
    }

    bool needsDistanceAnalysisCheck()
    {
        const int ticksAddedSinceLastCheck = this->tickCount - this->ticksOnLastCheck;
        return this->buffer.peek() != nullptr && ticksAddedSinceLastCheck >= this->checkThreshold;
    }

    double getAverageDistance()
    {
        auto latestTick = this->buffer.peek();
        if (!latestTick)
        {
            std::cout << "Tried to check distance but no data available" << std::endl;
            return 0;
        }
        const float latestPrice = latestTick->first;
        const long latestVolume = latestTick->second;
        double totalDistance = 0;
        unsigned int currentTickCount = 0;
        for (const auto &tick : this->buffer)
        {
            const float dp = latestPrice - tick.first;
            const long dv = latestVolume - tick.second;
            const double distance = std::sqrt(dp * dp + dv * dv);
            totalDistance += distance;
            ++currentTickCount;
        }

        this->ticksOnLastCheck = this->tickCount;

        return totalDistance / (double)currentTickCount;
    }
};