import { Subscribable } from "event/Event";

export interface ThreadHistoryEntry {
    id: string,
    timestamp: number
}

export interface ThreadHistory {
    readonly onChange: Subscribable<void>

    get(id: string): Promise<ThreadHistoryEntry | null>
    add(id: string): Promise<void>
    remove(id: string): Promise<void>
    clear(): Promise<void>
    dispose(): void
}
