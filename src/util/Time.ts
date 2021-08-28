export function currentTimestampSeconds(): number {
    return Math.floor(Date.now() / 1000);
}

export function wait(timeout: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, timeout);
    });
}
