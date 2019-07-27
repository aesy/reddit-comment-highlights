import { expect } from "chai";
import { capture, spy } from "ts-mockito";
import { InMemoryStorage } from "storage/Storage";
import { CompressedStorage } from "storage/CompressedStorage";

function sizeOf(data: any): number {
    return Buffer.byteLength(JSON.stringify(data), "utf8");
}

describe("CompressedStorage", () => {
    it("should compress the data", async () => {
        const data: string[] = new Array(100).fill("woop");
        const baseStorage = new InMemoryStorage<string>();
        const spiedStorage = spy(baseStorage);
        const cachedStorage = new CompressedStorage<string[]>(baseStorage);

        await cachedStorage.save(data);

        const compressed = capture(spiedStorage.save).first()[ 0 ];

        expect(sizeOf(compressed)).to.be.lessThan(sizeOf(data));
    });

    it("should not save original data", async () => {
        const data = "woop";
        const baseStorage = new InMemoryStorage<string>();
        const spiedStorage = spy(baseStorage);
        const cachedStorage = new CompressedStorage<string>(baseStorage);

        await cachedStorage.save(data);

        const compressed = capture(spiedStorage.save).first()[ 0 ];

        expect(data).to.not.equal(compressed);
    });
});
