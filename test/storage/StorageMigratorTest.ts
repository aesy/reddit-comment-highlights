import { expect } from "chai";
import { InMemoryStorage } from "storage/InMemoryStorage";
import { StorageMigrator } from "storage/StorageMigrator";

describe("StorageMigrator", () => {
    it("should clear source storage", async () => {
        const sourceStorage = new InMemoryStorage<string>();
        const targetStorage = new InMemoryStorage<string>();
        const migrator = new StorageMigrator();

        await sourceStorage.save("woop");
        await migrator.migrate(sourceStorage, targetStorage);

        const sourceData = await sourceStorage.load();

        expect(sourceData).to.equal(null);
    });

    it("should overwrite target storage", async () => {
        const sourceStorage = new InMemoryStorage<string>();
        const targetStorage = new InMemoryStorage<string>();
        const migrator = new StorageMigrator();

        await sourceStorage.save("woop");
        await targetStorage.save("wawawa");
        await migrator.migrate(sourceStorage, targetStorage);

        const targetData = await targetStorage.load();

        expect(targetData).to.equal("woop");
    });
});
