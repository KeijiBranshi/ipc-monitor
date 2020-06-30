import { Observable } from "rxjs/Observable";
import { merge } from "rxjs/observable/merge";
import { IpcMark } from "common/types";
import createIpcMainMonitor from "main/monitor-ipc-main";
import createWebContentsMonitor from "main/monitor-web-contents";
import mergeAllWebContents from "main/on-all-webcontents";

export function createMainProcessIpcMonitor(): Observable<IpcMark> {
  return merge(
    createIpcMainMonitor(),
    mergeAllWebContents(createWebContentsMonitor)
  );
}

let singleton: Observable<IpcMark>;
export default function getMainProcessIpcMonitor(): Observable<IpcMark> {
  if (!singleton) {
    singleton = createMainProcessIpcMonitor();
  }
  return singleton;
}
