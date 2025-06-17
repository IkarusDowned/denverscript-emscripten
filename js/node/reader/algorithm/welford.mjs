export class WelfordSpike {
    constructor(value, stddev, mean) {
        this.value = value;
        this.stddev = stddev;
        this.mean = mean;
    }
}

export class Welford {
    #packetCount = 0;
    #mean = 0;
    #m2 = 0;
    #threshold;
    #defaultThreshold;
    #minThreshold;
    #maxThreshold;
    #recentSpikeCount = 0;

    static ADJUSTMENT_WINDOW = 1000;
    static THRESHOLD_RATE_CHECK = 0.1;

    constructor(threshold, minThreshold, maxThreshold) {
        this.#threshold = threshold;
        this.#defaultThreshold = threshold;
        this.#minThreshold = minThreshold;
        this.#maxThreshold = maxThreshold;
    }

    #adjustThreshold() {
        const spikeRate = this.#recentSpikeCount / Welford.ADJUSTMENT_WINDOW;

        if (spikeRate > Welford.THRESHOLD_RATE_CHECK) {
            this.#threshold = Math.min(
                this.#threshold + Welford.THRESHOLD_RATE_CHECK * 2.0,
                this.#maxThreshold
            );
        } else if (spikeRate < Welford.THRESHOLD_RATE_CHECK) {
            this.#threshold = Math.max(
                this.#threshold - Welford.THRESHOLD_RATE_CHECK,
                this.#minThreshold
            );
        }

        this.#recentSpikeCount = 0;
    }

    updateAndDetectSpike(value) {
        this.#packetCount += 1;

        const delta = value - this.#mean;
        this.#mean += delta / this.#packetCount;
        const delta2 = value - this.#mean;
        this.#m2 += delta * delta2;

        if (this.#packetCount < 2) {
            return null; // insufficient data
        }

        const variance = this.#m2 / (this.#packetCount - 1);
        const stddev = Math.sqrt(variance);

        if (Math.abs(value - this.#mean) > this.#threshold * stddev) {
            this.#recentSpikeCount += 1;

            if (this.#packetCount % Welford.ADJUSTMENT_WINDOW === 0) {
                this.#adjustThreshold();
            }

            return new WelfordSpike(value, stddev, this.#mean);
        }

        if (this.#packetCount % Welford.ADJUSTMENT_WINDOW === 0) {
            this.#adjustThreshold();
        }

        return null;
    }
}
