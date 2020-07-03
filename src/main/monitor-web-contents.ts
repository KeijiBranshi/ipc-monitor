import { WebContents } from "electron";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import { v4 as uuid } from "uuid";
import createMonitor from "common/create-monitor";
import { createFunctionWrappers, createMarker } from "common/function-wrappers";
import { IpcMark, ObservableConstructor } from "common/types";

function createWebContentsWrapper(
  contents: WebContents
): ObservableConstructor<IpcMark> {
  return (observer: Observer<IpcMark>) => {
    /** Helper Functions */
    const mark = createMarker({
      uuid,
      sink: observer,
    });
    const [wrapEventSender] = createFunctionWrappers({ mark });

    /** Track the original function implementations */
    const originalSend = contents.send;

    /* eslint-disable no-param-reassign */
    contents.send = wrapEventSender(
      originalSend.bind(contents),
      () => !contents.isDestroyed()
    );

    /** Return callback to unwrap/cleanup */
    return () => {
      contents.send = originalSend;
    };
    /* eslint-enable no-param-reassign */
  };
}

export default function createWebContentsMonitor(
  contents: WebContents
): Observable<IpcMark> {
  // monitor the WebContents object (for outgoing messages)
  const wrap = createWebContentsWrapper(contents);
  return createMonitor({ wrap });
}
