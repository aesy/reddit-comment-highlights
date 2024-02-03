import { expect } from "chai";
import { capture, spy } from "@typestrong/ts-mockito";
import { InMemoryStorage } from "@/storage/InMemoryStorage";
import { CompressedStorage } from "@/storage/CompressedStorage";

function sizeOf(data: any): number {
    return Buffer.byteLength(JSON.stringify(data), "utf8");
}

describe("CompressedStorage", () => {
    [
        null,
        "",
        "woop",
        0,
        1,
        [],
        [null],
        [""],
        ["woop"],
        {},
        { woop: "wawawa" },
    ].forEach((item) => {
        it(`should be able write and read '${JSON.stringify(item)}'`, async () => {
            const baseStorage = new InMemoryStorage<string>();
            const compressedStorage = new CompressedStorage<any>(
                "test",
                baseStorage,
            );

            await compressedStorage.save(item);
            const data = await compressedStorage.load();

            expect(data).to.deep.equal(item);
        });
    });

    it("should be able to load from an empty storage", async () => {
        const baseStorage = new InMemoryStorage<string>();
        const compressedStorage = new CompressedStorage<string[]>(
            "test",
            baseStorage,
        );

        const data = await compressedStorage.load();

        expect(data).to.equal(null);
    });

    it("should compress the data", async () => {
        const data: string[] = new Array(100).fill("woop");
        const baseStorage = new InMemoryStorage<string>();
        const compressedStorage = new CompressedStorage<string[]>(
            "test",
            baseStorage,
        );
        const spiedStorage = spy(baseStorage);

        await compressedStorage.save(data);

        const compressed = capture(spiedStorage.save).first()[0];

        expect(sizeOf(compressed)).to.be.lessThan(sizeOf(data));
    });

    it("should not save original data", async () => {
        const data = "woop";
        const baseStorage = new InMemoryStorage<string>();
        const compressedStorage = new CompressedStorage<string>(
            "test",
            baseStorage,
        );
        const spiedStorage = spy(baseStorage);

        await compressedStorage.save(data);

        const compressed = capture(spiedStorage.save).first()[0];

        expect(data).to.not.equal(compressed);
    });
});
