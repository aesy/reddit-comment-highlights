import { expect } from "chai";
import { TruncatingThreadHistory, ThreadHistoryEntry } from "storage/ThreadHistory";
import { InMemoryStorage } from "storage/Storage";

describe("TruncatingThreadHistory", () => {
    it("should save to underlying storage", async () => {
        const id = "123";
        const storage = new InMemoryStorage<ThreadHistoryEntry[]>();
        const history = new TruncatingThreadHistory(storage, 1000);

        await history.add(id);

        const entry = await storage.load();

        expect(entry).to.not.equal(null);
        expect(entry).to.have.length(1);
        expect(entry![ 0 ].id).to.be.equal(id);
    });

    it("should load from underlying storage", async () => {
        const entry = { id: "123", timestamp: 123 };
        const storage = new InMemoryStorage<ThreadHistoryEntry[]>();
        const history = new TruncatingThreadHistory(storage, 1000);

        await storage.save([ entry ]);

        const result = await history.get(entry.id);

        expect(result).to.not.equal(null);
        expect(result).to.be.equal(entry);
    });

    it("should remove threads after a given time", async () => {
        const entry = { id: "123", timestamp: 123 };
        const storage = new InMemoryStorage<ThreadHistoryEntry[]>();
        const history = new TruncatingThreadHistory(storage, 1);

        await storage.save([ entry ]);

        setTimeout(async () => {
            const result = await history.get(entry.id);

            expect(result).to.not.equal(null);
            expect(result).to.have.length(0);
        }, 5);
    }).timeout(10);
});
