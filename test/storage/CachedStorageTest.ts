import { expect } from "chai";
import { spy, verify } from "ts-mockito";
import { InMemoryStorage } from "storage/InMemoryStorage";
import { CachedStorage } from "storage/CachedStorage";

describe("CachedStorage", () => {
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
