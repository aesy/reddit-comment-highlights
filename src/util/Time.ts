export function currentTimestampSeconds(): number {
    return Math.floor(Date.now() / 1000);
}

export function wait<T>(timeout: number): Promise<T> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, timeout);
    });
}
