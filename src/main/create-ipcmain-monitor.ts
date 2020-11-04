import { IpcMain, ipcMain } from "electron";
import { Observable } from "rxjs/Observable";
import { _throw as throwError } from "rxjs/observable/throw";
import { Observer } from "rxjs/Observer";
import createMonitor from "../common/create-monitor";
import {
  createFunctionWrappers,
  createMarker,
} from "../common/function-wrappers";
import { IpcMark, ObservableConstructor } from "../common/types";

function createIpcWrapper(ipc: IpcMain): ObservableConstructor<IpcMark> {
  return (observer: Observer<IpcMark>) => {
    /** Helper Functions */
    const mark = createMarker({ sink: observer, module: "ipcMain" });
    const [, wrapEventReceiver] = createFunctionWrappers({ mark });

    /** Track the original function implementations */
    /* eslint-disable no-param-reassign  */
    const originalEmit = ipc.emit;
    ipc.emit = wrapEventReceiver(originalEmit.bind(ipc), "emit");

    /** Return callback to unwrap/cleanup */
    return function restore() {
      ipc.emit = originalEmit;
    };
    /* eslint-enable no-param-reassign  */
  };
}

/**
 * Returns an Observable that monitors the `ipcMain` Electron module.
 * Returned Observable emits an [`IpcMark`](../common/types) whenever a message is received
 * through `ipcMain` via `ipcMain.on('ipc-message', (event) => { ... })`
 */
export default function createIpcMainMonitor(): Observable<IpcMark> {
  const isMainProcess = process && ipcMain;
  if (!isMainProcess) {
    return throwError(new Error("ipcMain does not exist in this process"));
  }

  const wrap = createIpcWrapper(ipcMain);
  const monitor = createMonitor({ wrap });

  return monitor;
}
