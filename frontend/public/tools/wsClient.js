let ws = null;
let reconnectTimeout = null;
export function getWebSocket() {
    if (!ws || ws.readyState === WebSocket.CLOSED) {
        connect();
    }
    return ws;
}
function connect() {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const WS_URL = `${proto}//${window.location.host}/ws`;
    ws = new WebSocket(WS_URL);
    ws.addEventListener("open", () => {
        console.log("[WS] Connected");
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
    });
    ws.addEventListener("close", () => {
        console.log("[WS] Disconnected, retrying in 2s...");
        if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(connect, 2000);
        }
    });
    ws.addEventListener("error", (err) => {
        console.error("[WS] Error:", err);
        ws?.close();
    });
}
