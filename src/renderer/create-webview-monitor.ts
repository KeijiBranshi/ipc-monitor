import { WebviewTag, IpcMessageEvent } from "electron";
import { Observer } from "rxjs";
import { fromEvent } from "rxjs/observable/fromEvent";
import { _throw as throwError } from "rxjs/observable/throw";
import createMonitor from "../common/create-monitor";
import {
  createMarker,
  createFunctionWrappers,
  extractCorrelationId,
} from "../common/function-wrappers";
import { ObservableConstructor, IpcMark, IpcMonitor } from "../common/types";

import "rxjs/add/operator/takeUntil";

function createWebviewWrapper(
  webview: WebviewTag
): ObservableConstructor<IpcMark> {
  return (observer: Observer<IpcMark>) => {
    if (!observer) {
      throw new Error("No Observer provided to Observable constructor Fn");
    }

    /** Helper Functions */
    const mark = createMarker({ sink: observer, module: "webviewTag" });
    const [wrapEventSender] = createFunctionWrappers({
      mark,
    });

    /** Track the original function implementations */
    const originalSend: typeof webview.send = webview.send.bind(webview);

    /* eslint-disable no-param-reassign  */
    (webview.send as any) = wrapEventSender(originalSend, "send");
    const incomingMessageObserver = (event: IpcMessageEvent) => {
      const { channel, args } = event;
      const correlationId = extractCorrelationId(...args);
      mark("incoming", channel, "addEventListener", correlationId);
    };
    webview.addEventListener("ipc-message", incomingMessageObserver);

    /** Return callback to unwrap/cleanup */
    return function restore() {
      webview.send = originalSend;
      webview.removeEventListener("ipc-message", incomingMessageObserver);
    };
    /* eslint-enable no-param-reassign  */
  };
}

function isWebviewTag(webview: WebviewTag): webview is WebviewTag {
  return (
    webview &&
    webview instanceof HTMLElement &&
    typeof webview.send === "function"
  );
}

/**
 * Returns an Observable that monitors the provided [`WebviewTag`]() object.
 * Returned Observable emits an [`IpcMark`](../common/types) whenever a message is
 * through `WebviewTag` via `ipcMain.on('ipc-message', (event) => { ... })`
 */
export default function createWebviewMonitor(webview: WebviewTag): IpcMonitor {
  const isRendererProcess =
    process?.type === "renderer" && isWebviewTag(webview);
  if (!isRendererProcess) {
    return throwError(
      new Error(
        "Provided argument is not compatible with this Renderer process"
      )
    );
  }

  // monitor the WebContents object (for outgoing messages)
  const contentsDestroyed = fromEvent<void>(webview, "destroyed");
  const wrap = createWebviewWrapper(webview);
  return createMonitor({ wrap }).takeUntil(contentsDestroyed);
}
