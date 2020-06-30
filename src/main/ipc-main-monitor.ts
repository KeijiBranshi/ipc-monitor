import { performance } from "perf_hooks";
import { IpcMain, ipcMain } from "electron";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import { v4 as uuid } from "uuid";
import createMonitor from "common/create-monitor";
import { createWrappers } from "common/function-wrappers";
import { IpcMark, ObservableConstructor } from "common/types";

function createIpcWrapper(ipc: IpcMain): ObservableConstructor<IpcMark> {
  return (observer: Observer<IpcMark>) => {
    /** Helper Functions */
    const [, wrapEventReceiver] = createWrappers({
      uuid,
      performance,
      sink: observer,
    });

    /** Track the original function implementations */
    /* eslint-disable no-param-reassign  */
    const originalEmit = ipc.emit;
    ipc.emit = wrapEventReceiver(originalEmit.bind(ipc));

    /** Return callback to unwrap/cleanup */
    return () => {
      ipc.emit = originalEmit;
    };
    /* eslint-enable no-param-reassign  */
  };
}

export default function createIpcMainMonitor(): Observable<IpcMark> {
  const wrap = createIpcWrapper(ipcMain);
  const monitor = createMonitor({ wrap });

  return monitor;
}
