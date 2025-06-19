//this is an incomplete implementation. Not production ready, only meant for the purposes of this talk

export default class CircularBuffer {
    #head = 0;
    #tail = 0;
    #capacity = 0;
    #buffer = null;
    #size = 0;

    constructor(capacity) {
        if (capacity < 1 || !Number.isInteger(capacity)) {
            console.log(`WARN: capacity: ${capacity} is too low, defaulting to 1`);
        }
        this.#capacity = Math.max(1, capacity);
        this.#buffer = new Array(capacity).fill(null);
        this.#head = 0;
        this.#tail = 0;
        this.#size = 0;
    }

    enqueue(item) {
        this.#buffer[this.#tail] = item;
        this.#tail = (this.#tail + 1) % this.#capacity;
        if (this.#size < this.#capacity) {
            this.#size++;
        } else {
            this.#head = (this.#head + 1) % this.#capacity;
        }
    }

    forEach(callback) {
        for (let i = 0; i < this.#size; i++) {
            const index = (this.#head + i) % this.#capacity;
            callback(this.#buffer[index]);
        }
    }

    peek() {
        if (this.#size === 0) return null;
        const lastIndex = (this.#tail - 1 + this.#capacity) % this.#capacity;
        return this.#buffer[lastIndex];
    }


}