import { WebviewTag } from "electron";
import { Observer } from "rxjs";
import { fromEvent } from "rxjs/observable/fromEvent";
import { _throw as throwError } from "rxjs/observable/throw";
import createMonitor from "../common/create-monitor";
import {
  createMarker,
  createFunctionWrappers,
} from "../common/function-wrappers";
import { ObservableConstructor, IpcMark, IpcMonitor } from "../common/types";

function createWebviewWrapper(
  webview: WebviewTag
): ObservableConstructor<IpcMark> {
  return (observer: Observer<IpcMark>) => {
    /** Helper Functions */
    const mark = createMarker({ sink: observer });
    const [wrapEventSender] = createFunctionWrappers({
      mark,
    });

    /** Track the original function implementations */
    const originalSend: typeof webview.send = webview.send.bind(webview);

    /* eslint-disable no-param-reassign  */
    webview.send = wrapEventSender(originalSend, "send");

    /** Return callback to unwrap/cleanup */
    return function restore() {
      webview.send = originalSend;
    };
    /* eslint-enable no-param-reassign  */
  };
}

export default function createWebviewMonitor(webview: WebviewTag): IpcMonitor {
  const isRendererProcess = process?.type === "renderer";
  if (!isRendererProcess) {
    return throwError(new Error("Cannot access webContents from this process"));
  }

  // monitor the WebContents object (for outgoing messages)
  const contentsDestroyed = fromEvent<void>(webview, "destroyed");
  const wrap = createWebviewWrapper(webview);
  return createMonitor({ wrap }).takeUntil(contentsDestroyed);
}
