import { expect } from "chai";
import { objectContaining, spy, verify } from "@typestrong/ts-mockito";
import { type Options, ExtensionOptions } from "@/options/ExtensionOptions";
import { InMemoryStorage } from "@/storage/InMemoryStorage";

describe("ExtensionOptions", () => {
    const defaults = {
        backColor: "red",
        backNightColor: "green",
        border: "1 px solid red",
        clearCommentOnClick: true,
        clearCommentincludeChildren: true,
        customCSS: null,
        customCSSClassName: "test",
        debug: true,
        frontColor: "blue",
        frontNightColor: "purple",
        linkColor: null,
        linkNightColor: null,
        quoteTextColor: null,
        quoteTextNightColor: null,
        sync: true,
        threadRemovalTimeSeconds: 42,
        useCompression: true,
    };

    it("should be able to load from an empty storage", async () => {
        const storage = new InMemoryStorage<Partial<Options>>();
        const options = new ExtensionOptions(storage, defaults);

        const data = await options.get();

        expect(data).to.deep.equal(defaults);
    });

    it("should read from underlying storage", async () => {
        const storage = new InMemoryStorage<Partial<Options>>();
        const options = new ExtensionOptions(storage, defaults);

        await storage.save({ border: "test" });

        const spiedStorage = spy(storage);

        const result = await options.get();

        verify(spiedStorage.load()).once();

        expect(result.border).to.equal("test");
    });

    it("should write to underlying storage", async () => {
        const storage = new InMemoryStorage<Partial<Options>>();
        const options = new ExtensionOptions(storage, defaults);
        const spiedStorage = spy(storage);

        await options.set({ border: "test" });

        verify(spiedStorage.save(objectContaining({ border: "test" }))).once();
    });
});
