const serializeError = (error) => ({
    name: error?.name,
    message: error?.message,
    stack: error?.stack,
});

const write = (level, message, context = {}) => {
    const entry = { timestamp: new Date().toISOString(), level, message, ...context };
    process.stdout.write(`${JSON.stringify(entry)}\n`);
};

export const logger = {
    info: (message, context) => write("info", message, context),
    warn: (message, context) => write("warn", message, context),
    error: (message, error, context = {}) => write("error", message, { ...context, error: serializeError(error) }),
};

export const requestLogger = (req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => logger.info("http_request", {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
        requestId: req.headers["x-request-id"],
    }));
    next();
};
