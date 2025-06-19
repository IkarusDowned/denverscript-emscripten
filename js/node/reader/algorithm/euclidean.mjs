import CircularBuffer from "../../util/circularbuffer.mjs";

export const DEFAULT_CHECK_THRESHOLD = 10;

export default class Euclidean {
    #buffer = null;

    #lastPrice = null;
    #lastVolume = null;

    #tickCount = 0;
    #ticksOnLastCheck = 0;
    #checkThreshold = DEFAULT_CHECK_THRESHOLD;

    constructor(bufferSize, checkThreshold) {
        bufferSize = Math.max(1, bufferSize);
        this.#buffer = new CircularBuffer(bufferSize);
        this.#checkThreshold = Math.max(1, checkThreshold);

    }


    onNewTick(tick) {
        
        if (tick.type === "price") {
            this.#lastPrice = tick.value;
        }
        else if (tick.type === "volume") {
            this.#lastVolume = tick.value;
        }
        if (this.#lastPrice !== null && this.#lastVolume !== null) {
            const compositeValue = { price: this.#lastPrice, volume: this.#lastVolume };
            this.#buffer.enqueue(compositeValue);
            ++this.#tickCount;
        }
    }

    needsDistanceAnalysisCheck() {
        const ticksAddedSinceLastCheck = this.#tickCount - this.#ticksOnLastCheck;
        return this.#buffer.peek() !== null && ticksAddedSinceLastCheck >= this.#checkThreshold;
    }

    getAverageDistance() {
        const latestTick = this.#buffer.peek();
        if (!latestTick) {
            throw new Error("Tried to check distance but no data available");
        }
        let totalDistance = 0;
        let currentTickAmount = 0;
        this.#buffer.forEach((tick) => {
            
            const dv = latestTick.volume - tick.volume;
            const dp = latestTick.price - tick.price;
            const distance = Math.sqrt(dv * dv + dp * dp);
            
            totalDistance += distance;
            ++currentTickAmount;
        });

        this.#ticksOnLastCheck = this.#tickCount;

        return totalDistance / currentTickAmount;


    }


}