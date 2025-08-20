import { Message } from "./types";

function signal<T>(value: T) {
    return function (next?: T) {
        if (arguments.length === 0) return value;
        value = next as T;
        return value;
    };
}

type Signal<T> = ReturnType<typeof signal<T>>;

export type Store = {
    history: Signal<string>;
    messages: Signal<Message[]>;
    sessionId: Signal<string>;
    stopReason: Signal<string | null>;
};

export const store: Store = {
    history: signal(""),
    messages: signal<Message[]>([]),
    sessionId: signal(""),
    stopReason: signal<string | null>(null),
};