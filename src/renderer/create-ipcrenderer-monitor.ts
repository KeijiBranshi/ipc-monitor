import { IpcRenderer, ipcRenderer } from "electron";
import { Observable } from "rxjs/Observable";
import { _throw as throwError } from "rxjs/observable/throw";
import { Observer } from "rxjs/Observer";
import createMonitor from "../common/create-monitor";
import {
  createFunctionWrappers,
  createMarker,
} from "../common/function-wrappers";
import { IpcMark, ObservableConstructor } from "../common/types";

function createIpcWrapper(ipc: IpcRenderer): ObservableConstructor<IpcMark> {
  return (observer: Observer<IpcMark>) => {
    if (!observer) {
      throw new Error("No Observer provided to Observable constructor Fn");
    }

    /** Helper Functions */
    const mark = createMarker({ sink: observer, module: "ipcRenderer" });
    const [wrapEventSender, wrapEventReceiver] = createFunctionWrappers({
      mark,
    });

    /** Track the original function implementations */
    const originalEmit = ipc.emit.bind(ipc);
    const originalSend = ipc.send.bind(ipc);
    const originalSendToHost = ipc.sendToHost.bind(ipc);
    const originalSendTo = ipc.sendTo.bind(ipc);
    const originalSendSync = ipc.sendSync.bind(ipc);

    /* eslint-disable no-param-reassign  */
    ipc.emit = wrapEventReceiver(originalEmit, "emit");
    ipc.send = wrapEventSender(originalSend, "send");
    ipc.sendToHost = wrapEventSender(originalSendToHost, "sendToHost");
    ipc.sendSync = wrapEventSender(originalSendSync, "sendSync");
    ipc.sendTo = (...[id, ...outerArgs]: Parameters<IpcRenderer["sendTo"]>) => {
      // since ipc.sendTo has a slightly different signature,
      // we need to curry some args to reuse the common wrapEventSender
      const sendToWithoutId = (...args: Parameters<IpcRenderer["send"]>) =>
        originalSendTo(id, ...args);
      const wrappedSendTo = wrapEventSender(sendToWithoutId, "sendTo");
      return wrappedSendTo(...outerArgs);
    };
    // todo: sendSync

    /** Return callback to unwrap/cleanup */
    return function restore() {
      ipc.emit = originalEmit;
      ipc.send = originalSend;
      ipc.sendTo = originalSendTo;
      ipc.sendToHost = originalSendToHost;
      ipc.sendSync = originalSendSync;
    };
    /* eslint-enable no-param-reassign  */
  };
}

/**
 * Returns an Observable that monitors the `ipcRenderer` Electron module.
 * Returned Observable emits an [`IpcMark`](../common/types) whenever a message is either:
 * 1. received through `ipcRender` via `ipcRenderer.on('ipc-channel', (event) => { ... })`, or
 * 2. sent through ipcRenderer via `ipcRenderer.send('ipc-channel', 'arg0', 'arg1')`
 */
export default function createIpcRendererMonitor(): Observable<IpcMark> {
  const isRendererProcess = process?.type === "renderer" && ipcRenderer;
  if (!isRendererProcess) {
    return throwError(new Error("No ipcRenderer exists in this process"));
  }

  const wrap = createIpcWrapper(ipcRenderer);
  const monitor = createMonitor({ wrap });

  return monitor;
}
