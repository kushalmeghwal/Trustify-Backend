export function formatMessage(senderId, text) {
    return {
        senderId,
        text,
        timestamp: new Date().toISOString(),
    };
}
