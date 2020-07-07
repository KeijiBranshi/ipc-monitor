# RxJS Based Monitor for IPC Traffic

An Observable that wraps/decorates Electron's `ipcRenderer`/`ipcMain` module and emits meta data "marks" whenever a message is sent or received.

In some ways, this is just a glorified wrapper around `Observable.create()` for IPC.

## How To

```
// will wrap the ipc module for given process (main/renderer)
import ipcMonitor from "ipc-monitor";

ipcMonitor.subscribe(mark => {
  if (mark.type === "outgoing") {
    console.log(`Message Sent @ ${mark.time}`);
  }
  else if (mark.type === "incoming") {
    console.log(`Message Received @ ${mark.time}`);
  }
});
```

> Note: this module performs a side-effect by decorating the `send` and `emit` methods on ipc. Original methods are restored on `unsubscribe()`.

## TODO

1. Upgrade to RxJS v6. At the moment, I'm consuming this in an app that requires RxJS v5.
