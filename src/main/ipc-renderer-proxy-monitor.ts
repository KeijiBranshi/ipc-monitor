import { ipcMain, IpcMain, WebContents } from "electron";
import { createProxy } from "rx-ipc-beta";
import { Observable } from "rxjs";
import { v4 as uuid } from "uuid";
import { IpcMark } from "common/types";
import mergeAllWebContents from "main/on-all-webcontents";

export default function createRemoteRendererMonitor(): Observable<IpcMark> {
  return mergeAllWebContents((contents) => {
    const ipc = {
      on: (...[channel, listener]: Parameters<IpcMain["on"]>) =>
        ipcMain.on(channel, listener),
      off: (...[channel, listener]: Parameters<IpcMain["off"]>) =>
        ipcMain.off(channel, listener),
      send: (...[channel, ...args]: Parameters<WebContents["send"]>) =>
        contents.send(channel, ...args),
    };

    // monitor the WebContents object (for outgoing messages)
    return createProxy({
      channel: "ipc-monitor",
      ipc,
      uuid,
    });
  });
}
