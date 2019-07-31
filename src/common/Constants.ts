export const Constants = {
    REDESIGN_EXTENSION_NAME: "reddit-au-comment-highlights",
    OPTIONS_STORAGE_NAME: "options storage",
    OPTIONS_STORAGE_KEY: "reddit_au_options",
    THREAD_STORAGE_NAME: "thread storage",
    THREAD_STORAGE_KEY: "reddit_au_threads",
    SENTRY_DSN: "https://4f14a6987e94421b94ad94dcde860996@o1377925.ingest.sentry.io/6689275",
    STORAGE_UPDATE_INTERVAL_SECONDS: 10,
    CSS_TRANSITION_DURATION_SECONDS: 0.4,
    OPTIONS_DEFAULTS: {
        frontColor: "#000000",
        frontNightColor: "#ffffff",
        backColor: "#fffdcc",
        backNightColor: "#424242",
        linkColor: "#0079d3",
        linkNightColor: "#8cb3d9",
        quoteTextColor: "#4f4f4f",
        quoteTextNightColor: "#a0a0a0",
        border: "1px dotted #cccccc",
        clearCommentOnClick: false,
        clearCommentincludeChildren: true,
        customCSS: null,
        customCSSClassName: "highlight",
        threadRemovalTimeSeconds: 604800, // A week
        useCompression: false,
        sync: true,
        debug: false,
        sendErrorReports: false
    }
};
