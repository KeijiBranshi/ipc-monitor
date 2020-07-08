import { WebviewTag } from "electron";
import { Observable, Observer } from "rxjs";
import { from } from "rxjs/observable/from";
import {
  createMarker,
  createFunctionWrappers,
} from "../common/function-wrappers";
import { ObservableConstructor, IpcMark } from "../common/types";
import onMutations from "./rx-mutation-observer";

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

function createWebviewMonitor(webview: WebviewTag) {}
