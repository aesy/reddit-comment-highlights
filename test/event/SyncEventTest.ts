import { expect } from "chai";
import { SyncEvent } from "event/SyncEvent";

describe("SyncEvent", () => {
    it("should call each listener once on each dispatch", async () => {
        let callCount = 0;
        const dispatches = 10;
        const listener = () => { callCount++; };
        const event = new SyncEvent<string>();

        event.subscribe(listener);

        for (let i = 0; i < dispatches; i++) {
            event.dispatch("wawawa");
        }

        expect(callCount).to.equal(dispatches);
    });

    it("should pass dispatch message to each listener", async () => {
        const message = "woop woop";
        const listener = (arg0: string) => { expect(arg0).to.equal(message); };
        const event = new SyncEvent<string>();

        event.subscribe(listener);
        event.dispatch(message);
    });

    it("should call one-off listeners only once", async () => {
        let callCount = 0;
        const listener = () => { callCount++; };
        const event = new SyncEvent<string>();

        event.once(listener);

        for (let i = 0; i < 10; i++) {
            event.dispatch("wawawa");
        }

        expect(callCount).to.equal(1);
    });
});
