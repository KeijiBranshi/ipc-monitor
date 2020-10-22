import { IpcRenderer, ipcRenderer } from "electron";
import { Observable } from "rxjs/Observable";
import { _throw as throwError } from "rxjs/observable/throw";
import { Observer, NextObserver } from "rxjs/Observer";
import { TeardownLogic } from "rxjs/Subscription";
import createMonitor from "../common/create-monitor";
import {
  createFunctionWrappers,
  createMarker,
} from "../common/function-wrappers";
import { IpcMark, ObservableConstructor, SendFn } from "../common/types";

type ExtractProps<T, TProps extends T[keyof T]> = Pick<
  T,
  ExtractPropsKey<T, TProps>
>;

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
  return () => (ipc.emit = originalEmit);
};

const sends = (ipc: IpcRenderer): Observable<IpcMark> => {
  return Observable.create((observer: Observer<IpcMark>) => {
    /** Helper Functions */
    const mark = createMarker({ sink: observer, module: "ipcRenderer" });
    const [, wrapEmit] = createFunctionWrappers(mark);
    const originalEmit = ipc.emit.bind(ipc);
    ipc.emit = wrapEmit(originalEmit, "emit");
    return () => (ipc.emit = originalEmit);
  });
};

type ValueOf<T> = T[keyof T];
type FilterFlags<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never;
};

function isSendFn<T>(target: T, key: keyof T): (T[key] is () => void) {
  return typeof target[key] === 'function';
};

const methods = <T extends IpcRenderer, K extends keyof FilterFlags<T, Function>>(
  ipc: T,
  method: K,
  module: string,
  wrapper: (mark: NextObserver<IpcMark>['next']) => T[K]
): Observable<IpcMark> => {
  return Observable.create((observer: Observer<IpcMark>) => {
    if (typeof ipc[method] !== "function") {
      return () => undefined;
    }
    const mark = createMarker({
      sink: observer,
      module: "ipcRenderer",
      method,
    });
    const [wrap] = createFunctionWrappers(mark);
    const original = ipc[method].bind(ipc);
    /* eslint-disable no-param-reassign  */
    ipc[method] = wrap(original);

    return () => {
      ipc[method] = original;
    };
    /* eslint-enable no-param-reassign  */
  });
};

function createIpcWrapper(ipc: IpcRenderer): ObservableConstructor<IpcMark> {
  return (observer: Observer<IpcMark>) => {
    if (!observer) {
      throw new Error("No Observer provided to Observable constructor Fn");
    }

    /** Helper Functions */
    const mark = createMarker({ sink: observer, module: "ipcRenderer" });
    const [wrapEventSender, wrapEventReceiver] = createFunctionWrappers(mark);

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
