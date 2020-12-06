import { expect } from "chai";
import { ThreadHistoryEntry } from "history/ThreadHistory";
import { TruncatingThreadHistory } from "history/TruncatingThreadHistory";
import { InMemoryStorage } from "storage/InMemoryStorage";

describe("TruncatingThreadHistory", () => {
    it("should be able to read from an empty storage", async () => {
        const storage = new InMemoryStorage<ThreadHistoryEntry[]>();
        const history = new TruncatingThreadHistory(storage, 1000);

        const data = await history.get('test');

        expect(data).to.deep.equal(null);
    });

    it("should write to underlying storage", async () => {
        const id = "123";
        const storage = new InMemoryStorage<ThreadHistoryEntry[]>();
        const history = new TruncatingThreadHistory(storage, 1000);

        await history.add(id);

        const entry = await storage.load();

        expect(entry).to.not.equal(null);
        expect(entry).to.have.length(1);
        expect(entry![ 0 ].id).to.be.equal(id);
    });

    it("should read from underlying storage", async () => {
        const entry = { id: "123", timestamp: 1231231232132 };
        const storage = new InMemoryStorage<ThreadHistoryEntry[]>();
        const history = new TruncatingThreadHistory(storage, 1000);

        await storage.save([ entry ]);

        const result = await history.get(entry.id);

        expect(result).to.not.equal(null);
        expect(result).to.be.equal(entry);
    });
});
