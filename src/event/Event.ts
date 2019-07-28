export type EventListener<T> = (data: T) => void;

export interface Triggerable<T> {
    dispatch(data: T): this;
    dispose(): void;
}

export interface Subscribable<T> {
    subscribe(listener: EventListener<T>): this;
    unsubscribe(listener: EventListener<T>): this;
    once(listener: EventListener<T>): this;
    listener(): MethodDecorator;
}

export interface Event<T> extends Subscribable<T>, Triggerable<T> {}
