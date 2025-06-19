export class DelayVisualizer {
    #delays = {};
    #delayScale = 5;

    constructor(measuredItems) {
        measuredItems.forEach(item => this.#delays[item] = 0);
    }

    #buildVisualization(key) {
        const scaledDelay = this.#delays[key];
        const delayVisual = '='.repeat(scaledDelay);
        return `[${key}]: ${delayVisual}\n`;
    }

    update(item, { createdAt /*, analyzedAt*/ }) {
        const renderedAt = Date.now();

        const totalDelay = renderedAt - createdAt;

        // const renderLag = renderedAt - analyzedAt;

        const scaled = Math.max(Math.floor(totalDelay / this.#delayScale), 1);
        this.#delays[item] = scaled;
    }

    visualize() {
        const now = new Date();
        let visuals = "";
        for (const key in this.#delays) {
            visuals += this.#buildVisualization(key);
        }

        const output =
            '\x1B[?25l' +      // hide cursor
            '\x1B[2J' +        // clear screen
            '\x1B[0;0H' +      // move cursor to top-left
            now + '\n' +
            visuals;

        process.stdout.write(output);
    }
}
