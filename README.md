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

## IpcMetrics

This is the term used to refer to operations one can perform on an `ipcMonitor` to post-process data about ipc traffic. It's just an alias for the standard RxJS operator type definition:

```
type IpcMetric<T> = (source: Observable<IpcMark>) => Observable<T>
```

There's an unpublished "sample-metrics" folder with, well, sample metrics that one can apply to their ipcMonitors. Using other libraries like `rx-ipc` to merge all ipcMonitor data into a single process, you can calculate info like **average message latency** across all processes. E.G.

```
// in renderer process
import ipcRendererMonitor from "ipc-monitor";
import { proxify } from "rx-ipc";

ipcRendererMonitor.pipe(
  proxify({ channel: "ipc-monitor" })
).subscribe();
```

```
// in main process
import ipcMainMonitor from "ipc-monitor";
import { averageLatency } from "ipc-monitor/sample-metrics/latency";
import { createProxy } from "rx-ipc";
import { merge } from "rxjs";

const ipcRendererMonitorProxy = createProxy({ channel: "ipc-monitor" });

const ipcMonitorGlobal = merge(ipcMainMonitor, ipcRendererMonitorProxy);

ipcMonitorGlobal.pipe(
  averageLatency()
).subscribe(({ averageLatency }) => console.log(`Current Average IPC Latency: ${averageLatency}`))
```

## TODO

1. Upgrade to RxJS v6. While the above examples use RxJS v6 syntax, this library currently utilizes RxJS v5. (this is because I consume this in an app with an RxJS v5 dependency :/ )
