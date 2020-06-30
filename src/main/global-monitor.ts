import { Observable } from "rxjs/Observable";
import { merge } from "rxjs/observable/merge";
import { IpcMark } from "common/types"
import createIpcMainMonitor from "main/ipc-main-monitor";
import createWebContentsMonitor from "main/web-contents-monitor";
import createRemoteRendererMonitor from "main/ipc-renderer-proxy-monitor";

let singleton: Observable<IpcMark>;

/**
 * Create a monitor on the provided ipc.
 */
export function createGlobalIpcMonitor(): Observable<IpcMark> {
  singleton ||
  return (
    (singleton = merge(
      createIpcMainMonitor(), // to monitor incoming messages
      createWebContentsMonitor(), // to monitor outgoing messages
      createRemoteRendererMonitor()
    ))
  );
}
