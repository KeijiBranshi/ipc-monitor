import { IpcRenderer, ipcRenderer } from "electron";
import { Observable } from "rxjs/Observable";
import { _throw as throwError } from "rxjs/observable/throw";
import { Observer } from "rxjs/Observer";
import createMonitor from "../common/create-monitor";
import {
  createFunctionWrappers,
  createMarker,
} from "../common/function-wrappers";
import { IpcMark, ObservableConstructor, SendFn } from "../common/types";
import { TeardownLogic } from "rxjs/Subscription";

type ExtractProps<T, TProps extends T[keyof T]> = Pick<T, ExtractPropsKey<T, TProps>>;

type ExtractPropsKey<T, TProps extends T[keyof T]> = {
  [P in keyof T]: T[P] extends TProps ? P : never;
}[keyof T];

type Hook = (ipc: IpcRenderer) => ObservableConstructor<IpcMark>;
type Hook2 = (wrapper: <T>(fn: T, n: string) => T) => TeardownLogic;

const emits = (ipc: IpcRenderer) => (observer: Observer<IpcMark>) => {
  /** Helper Functions */
  const mark = createMarker({ sink: observer, module: "ipcRenderer" });
  const [, wrapEmit] = createFunctionWrappers(mark);
  const originalEmit = ipc.emit.bind(ipc);
  ipc.emit = wrapEmit(originalEmit, "emit");
  return () => ipc.emit = originalEmit;
}

const sends = (ipc: IpcRenderer): Observable<IpcMark> => {
  return Observable.create((observer: Observer<IpcMark>) => {
    /** Helper Functions */
    const mark = createMarker({ sink: observer, module: "ipcRenderer" });
    const [, wrapEmit] = createFunctionWrappers(mark);
    const originalEmit = ipc.emit.bind(ipc);
    ipc.emit = wrapEmit(originalEmit, "emit");
    return () => ipc.emit = originalEmit;
  });
}

type FuncsOf<T> = typeof T[keyof T];

const isSendFn = (fn: Function, name: string): fn is SendFn => {
  return name.includes("send");
}

const methods = (ipc: IpcRenderer, method: keyof IpcRenderer): Observable<IpcMark> => {
  return Observable.create((observer: Observer<IpcMark>) => {
    /** Helper Functions */
    if (!isSendFn(ipc[method], method)) {
      observer.error('Not a Send Function');
      return;
    }
    const mark = createMarker({ sink: observer, module: "ipcRenderer" });
    const [wrap] = createFunctionWrappers(mark);
    const original = ipc[method].bind(ipc);
    ipc[method] = wrap(original, method);
    return () => ipc[method] = original;
  });
}

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

export default function createIpcRendererMonitor(): Observable<IpcMark> {
  const isRendererProcess = process?.type === "renderer" && ipcRenderer;
  if (!isRendererProcess) {
    return throwError(new Error("No ipcRenderer exists in this process"));
  }

  const wrap = createIpcWrapper(ipcRenderer);
  const monitor = createMonitor({ wrap });

  return monitor;
}
