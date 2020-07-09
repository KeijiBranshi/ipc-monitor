# RxJS Based Monitor for IPC Traffic

An Observable that wraps/decorates Electron's `ipcRenderer`/`ipcMain` module and emits meta data "marks" whenever a message is sent or received.

In some ways, this is just a glorified wrapper around `Observable.create()` for IPC.

## How To

```javascript
// import will detect which process you're on and wrap the appropriate ipc module
import ipcMonitor from "ipc-monitor";

// on subscribe, the ipc will get wrapped and this will emit meta data (this is a global side effect)
const subscription = ipcMonitor.subscribe(mark => {
  if (mark.type === "outgoing") {
    console.log(`Message Sent @ ${mark.time}`);
  }
  else if (mark.type === "incoming") {
    console.log(`Message Received @ ${mark.time}`);
  }
});

// later on... unsubscribing from the monitor will restore the ipc module to its original form
subscription.unsubscribe();
```

> Note: this module performs a side-effect by decorating the `send` and `emit` methods on ipc. Original methods are restored on `unsubscribe()`.

## TODO

1. Upgrade to RxJS v6. At the moment, I'm consuming this in an app that requires RxJS v5.
