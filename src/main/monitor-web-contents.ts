import { WebContents, ipcMain } from "electron";
import { Observable } from "rxjs/Observable";
import { fromEvent } from "rxjs/observable/fromEvent";
import { _throw as throwError } from "rxjs/observable/throw";
import { Observer } from "rxjs/Observer";
import { v4 as uuid } from "uuid";
import createMonitor from "../common/create-monitor";
import {
  createFunctionWrappers,
  createMarker,
} from "../common/function-wrappers";
import { IpcMark, ObservableConstructor } from "../common/types";

import "rxjs/add/operator/takeUntil";

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
      "send",
      () => !contents.isDestroyed()
    );

    /** Return callback to unwrap/cleanup */
    return function restore() {
      contents.send = originalSend;
    };
    /* eslint-enable no-param-reassign */
  };
}

export default function createWebContentsMonitor(
  contents: WebContents
): Observable<IpcMark> {
  const isMainProcess = process && ipcMain;
  if (!isMainProcess) {
    return throwError(new Error("Cannot access webContents from this process"));
  }

  // monitor the WebContents object (for outgoing messages)
  const contentsDestroyed = fromEvent<void>(contents, "destroyed");
  const wrap = createWebContentsWrapper(contents);
  return createMonitor({ wrap }).takeUntil(contentsDestroyed);
}
