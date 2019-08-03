import { expect } from "chai";
import { spy, verify } from "ts-mockito";
import { InMemoryStorage } from "storage/InMemoryStorage";
import { CachedStorage } from "storage/CachedStorage";

describe("CachedStorage", () => {
    [ null, "", "woop", 0, 1, [], [ null ], [ "" ], [ "woop" ], {}, { woop: "wawawa" } ]
        .forEach(item => {
            it(`should be able write and read '${ JSON.stringify(item) }'`, async () => {
                const baseStorage = new InMemoryStorage<string>();
                const cachedStorage = new CachedStorage<any>(baseStorage);

                await cachedStorage.save(item);
                const data = await cachedStorage.load();

                expect(data).to.deep.equal(item);
            });
        });

    it("should not load from underlying storage", async () => {
        const baseStorage = new InMemoryStorage<string>();
        const cachedStorage = new CachedStorage(baseStorage);

        await cachedStorage.save("woop");
        const spiedStorage = spy(baseStorage);
        const woop = await cachedStorage.load();

        verify(spiedStorage.load()).never();

        expect(woop).to.equal("woop");
    });
});
