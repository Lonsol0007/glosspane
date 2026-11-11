// True in the Android build, where the app is static files inside a WebView and there is no server.
export const isNative = process.env.NEXT_PUBLIC_TARGET === "android";
