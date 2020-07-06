import { IpcRenderer, ipcRenderer } from "electron";
import { Observable } from "rxjs/Observable";
import { _throw as throwError } from "rxjs/observable/throw";
import { Observer } from "rxjs/Observer";
import { v4 as uuid } from "uuid";
import createMonitor from "common/create-monitor";
import { createFunctionWrappers, createMarker } from "common/function-wrappers";
import { IpcMark, ObservableConstructor } from "common/types";

function createIpcWrapper(ipc: IpcRenderer): ObservableConstructor<IpcMark> {
  return (observer: Observer<IpcMark>) => {
    /** Helper Functions */
    const mark = createMarker({ uuid, sink: observer });
    const [wrapEventSender, wrapEventReceiver] = createFunctionWrappers({
      mark,
    });

    /** Track the original function implementations */
    const originalEmit = ipc.emit.bind(ipc);
    const originalSend = ipc.send.bind(ipc);
    const originalSendToHost = ipc.sendToHost.bind(ipc);
    const originalSendTo = ipc.sendTo.bind(ipc);

    /* eslint-disable no-param-reassign  */
    ipc.emit = wrapEventReceiver(originalEmit);
    ipc.send = wrapEventSender(originalSend);
    ipc.sendToHost = wrapEventSender(originalSendToHost);
    ipc.sendTo = (...[id, ...outerArgs]: Parameters<IpcRenderer["sendTo"]>) => {
      // since ipc.sendTo has a slightly different signature,
      // we need to curry some args to reuse the common wrapEventSender
      const sendToWithoutId = (...args: Parameters<IpcRenderer["send"]>) =>
        originalSendTo(id, ...args);
      const wrappedSendTo = wrapEventSender(sendToWithoutId);
      return wrappedSendTo(...outerArgs);
    };
    // todo: sendSync

    /** Return callback to unwrap/cleanup */
    return () => {
      ipc.emit = originalEmit;
      ipc.send = originalSend;
      ipc.sendTo = originalSendTo;
      ipc.sendToHost = originalSendToHost;
    };
    /* eslint-enable no-param-reassign  */
  };
}

export default function createIpcRendererMonitor(): Observable<IpcMark> {
  const isRendererProcess = process.type === "renderer" && ipcRenderer;
  if (!isRendererProcess) {
    return throwError(new Error("No ipcRenderer exists in this process"));
  }

  const wrap = createIpcWrapper(ipcRenderer);
  const monitor = createMonitor({ wrap });

  return monitor;
}
