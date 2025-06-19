let globalSeed = 0;
export function createSeededGenerator(seed) {
    const a = 1664525;
    const c = 1013904223;
    const m = 2 ** 32;

    return function () {
        globalSeed = (a * globalSeed + c) % m;
        return globalSeed / m;
    };
}