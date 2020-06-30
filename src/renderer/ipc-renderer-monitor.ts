import { IpcRenderer, ipcRenderer } from "electron";
import { Observable } from "rxjs/Observable";
// tslint:disable-next-line:no-ipc-renderer-import
import { Observer } from "rxjs/Observer";
import { v4 as uuid } from "uuid";
import createMonitor from "common/create-monitor";
import { createWrappers, createMarker } from "common/function-wrappers";
import { IpcMark, ObservableConstructor } from "common/types";

function createIpcWrapper(ipc: IpcRenderer): ObservableConstructor<IpcMark> {
  return (observer: Observer<IpcMark>) => {
    /** Helper Functions */
    const mark = createMarker({ uuid, sink: observer });
    const [wrapEventSender, wrapEventReceiver] = createWrappers({ mark });

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

export function createIpcRendererMonitor(): Observable<IpcMark> {
  const wrap = createIpcWrapper(ipcRenderer);
  const monitor = createMonitor({ wrap });

  // setupProxyMonitoringFromMain(monitor, context);

  return monitor;
}

/**
 * Create a monitor on the provided ipc.
 */
let singleton: Observable<IpcMark>;
export default function getIpcRendererMonitor(): Observable<IpcMark> {
  if (singleton) {
    singleton = createIpcRendererMonitor();
  }
  return singleton;
}
