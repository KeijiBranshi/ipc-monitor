import { ipcMain, IpcMain, WebContents } from "electron";
import { createProxy } from "rx-ipc-beta";
import { Observable } from "rxjs";
import { v4 as uuid } from "uuid";
import { IpcMark } from "common/types";

export default function createProxyRendererMonitor(
  contents: WebContents
): Observable<IpcMark> {
  const ipc = {
    on: (...[channel, listener]: Parameters<IpcMain["on"]>) =>
      ipcMain.on(channel, listener),
    off: (...[channel, listener]: Parameters<IpcMain["off"]>) =>
      ipcMain.off(channel, listener),
    send: (...[channel, ...args]: Parameters<WebContents["send"]>) => {
      if (contents.isDestroyed()) {
        return;
      }

      contents.send(channel, ...args);
    },
  };

  // monitor the WebContents object (for outgoing messages)
  return createProxy({
    channel: "ipc-monitor",
    ipc,
    uuid,
  });
}
