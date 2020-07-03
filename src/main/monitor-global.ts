import { Observable } from "rxjs/Observable";
import { merge } from "rxjs/observable/merge";
import { IpcMark } from "common/types";
import createIpcRendererProxyMonitor from "main/monitor-ipc-renderer-proxy";
import { mainProcessIpcMonitor } from "main/monitor-main-process";
import mergeAllWebContents from "main/on-all-webcontents";

export default function createGlobalIpcMonitor(): Observable<IpcMark> {
  return merge(
    mainProcessIpcMonitor,
    mergeAllWebContents(createIpcRendererProxyMonitor)
  );
}
