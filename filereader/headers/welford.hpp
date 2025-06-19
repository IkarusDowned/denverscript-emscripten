#pragma once
#include <optional>
#include <cmath>
#include <limits>
#include <iostream>

template <typename T>
struct WelfordSpike
{
    T value;
    float stddev;
    T mean;
};

template <typename T>
class Welford
{
private:
    long packetCount;
    float mean;
    float m2;
    float threshold;
    float defaultThreshold;
    float minThreshold;
    float maxThreshold;

    long recentSpikeCount;
    const int ADJUSTMENT_WINDOW = 1000;
    const float THREASHOLD_RATE_CHECK = 0.1f;

    inline T abs(T value)   //fast abs value
    {
        if constexpr (std::is_integral_v<T> && std::is_signed_v<T>)
        {
            T const mask = value >> (std::numeric_limits<T>::digits - 1);
            return (value + mask) ^ mask;
        }
        else
        {
            return std::fabs(value);
        }
    }

    inline void adjustThreshold()
    {
        float spikeRate = static_cast<float>(recentSpikeCount) / static_cast<float>(ADJUSTMENT_WINDOW);

        if (spikeRate > THREASHOLD_RATE_CHECK)
        { // too many spikes
            threshold = std::min(threshold + THREASHOLD_RATE_CHECK * 2.0f, maxThreshold);
        }
        else if (spikeRate < THREASHOLD_RATE_CHECK)
        { // too few
            threshold = std::max(threshold - THREASHOLD_RATE_CHECK , minThreshold);
        }

        recentSpikeCount = 0;
    }

public:
    Welford(float threashold, float minT, float maxT) : threshold(threashold), defaultThreshold(threashold),
                                                        minThreshold(minT), maxThreshold(maxT), recentSpikeCount(0)
    {
    }

    ~Welford()
    {
    }

    std::optional<WelfordSpike<T>> updateAndDetectSpike(const T &value)
    {
        ++packetCount;
        const float delta = static_cast<float>(value) - static_cast<float>(mean);
        mean += delta / static_cast<float>(packetCount);
        const float delta2 = value - static_cast<float>(mean);
        m2 += delta * delta2;
        if (packetCount < 2)
        {
            // insufficient data, return nothing
            return std::nullopt;
        }

        const float variance = m2 / static_cast<float>(packetCount - 1);
        const float stddev = std::sqrt(variance);

        if (abs(value - mean) > static_cast<T>(threshold * stddev))
        {
            ++recentSpikeCount;
            if (packetCount % ADJUSTMENT_WINDOW == 0)
            {
                adjustThreshold();
            }

            WelfordSpike<T> spike;
            spike.mean = static_cast<T>(mean);
            spike.stddev = stddev;
            spike.value = value;
            return spike;
        }

        if (packetCount % ADJUSTMENT_WINDOW == 0)
        {
            adjustThreshold();
        }

        return std::nullopt;
    }
};