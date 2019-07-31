import { expect } from "chai";
import { capture, spy } from "ts-mockito";
import { InMemoryStorage } from "storage/InMemoryStorage";
import { CompressedStorage } from "storage/CompressedStorage";

function sizeOf(data: any): number {
    return Buffer.byteLength(JSON.stringify(data), "utf8");
}

describe("CompressedStorage", () => {
    [ null, "", "woop", 0, 1, [], [ null ], [ "" ], [ "woop" ], {}, { woop: "wawawa" } ]
        .forEach(item => {
            it(`should be able write and read '${ JSON.stringify(item) }'`, async () => {
                const baseStorage = new InMemoryStorage<string>();
                const cachedStorage = new CompressedStorage<any>("test", baseStorage);

                await cachedStorage.save(item);
                const data = await cachedStorage.load();

                expect(data).to.deep.equal(item);
            });
        });

    it("should be able to load from an empty storage", async () => {
        const baseStorage = new InMemoryStorage<string>();
        const cachedStorage = new CompressedStorage<string[]>("test", baseStorage);

        const data = await cachedStorage.load();

        expect(data).to.equal(null);
    });

    it("should compress the data", async () => {
        const data: string[] = new Array(100).fill("woop");
        const baseStorage = new InMemoryStorage<string>();
        const spiedStorage = spy(baseStorage);
        const cachedStorage = new CompressedStorage<string[]>("test", baseStorage);

        await cachedStorage.save(data);

        const compressed = capture(spiedStorage.save).first()[ 0 ];

        expect(sizeOf(compressed)).to.be.lessThan(sizeOf(data));
    });

    it("should not save original data", async () => {
        const data = "woop";
        const baseStorage = new InMemoryStorage<string>();
        const spiedStorage = spy(baseStorage);
        const cachedStorage = new CompressedStorage<string>("test", baseStorage);

        await cachedStorage.save(data);

        const compressed = capture(spiedStorage.save).first()[ 0 ];

        expect(data).to.not.equal(compressed);
    });
});
