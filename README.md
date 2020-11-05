[![Build Status](https://travis-ci.org/KeijiBranshi/ipc-monitor.svg?branch=master)](https://travis-ci.org/KeijiBranshi/ipc-monitor)

# RxJS Based Monitor for IPC Traffic

An Observable that wraps/decorates Electron's `ipc` facilitating modules and emits meta data "marks" whenever a message is sent or received.

In some ways, this is just a glorified wrapper around `Observable.create()` for IPC.

## How To Use

```javascript
// import will detect which process you're on and wrap the appropriate ipc module
import ipcMonitor from "ipc-monitor";

// on subscribe, the ipc will get wrapped and this will emit meta data (this is a global side effect)
const subscription = ipcMonitor.subscribe((mark) => {
  if (mark.type === "outgoing") {
    console.log(`Message Sent @ ${mark.time}`);
  } else if (mark.type === "incoming") {
    console.log(`Message Received @ ${mark.time}`);
  }
});

// later on... unsubscribing from the monitor will restore the ipc module to its original form
subscription.unsubscribe();
```

> Note: this module performs a side-effect by decorating the `send` and `emit` methods on ipc. Original methods are restored on `unsubscribe()`.

## `IpcMark` Guide

`IpcMark` is the type definition for emissions from an `ipcMonitor`. It is necessarily serializable JSON payload. The below tables detail which `IpcMark.Module` and `IpcMark.Method` are used for a given ipc message event. Messages that incur an ipc message event are either incoming or outgoing from a given process (denoted by the `IpcMark.Direction` property). _Incoming_ and _Outoing_ messages are correlated via the `IpcMark.CorrelationId` property.

### Outgoing Message Marks

| Sender Process                                                                               | Receiver Process  | `IpcMark.Module`                                                  | `IpcMark.Method`   |
| -------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------- | ------------------ |
| [Main](https://www.electronjs.org/docs/tutorial/quick-start#main-and-renderer-processes)     | Renderer          | `webContents`                                                     | `send`             |
| [Renderer](https://www.electronjs.org/docs/tutorial/quick-start#main-and-renderer-processes) | Main              | [`ipcRenderer`](https://www.electronjs.org/docs/api/ipc-renderer) | `send`, `sendSync` |
| [Renderer](https://www.electronjs.org/docs/tutorial/quick-start#main-and-renderer-processes) | Renderer          | [`ipcRenderer`](https://www.electronjs.org/docs/api/ipc-renderer) | `sendTo`           |
| [Host Renderer](https://www.electronjs.org/docs/tutorial/web-embeds#webviews)                | Embedded Renderer | `webviewTag`                                                      | `send`             |
| [Embedded Renderer](https://www.electronjs.org/docs/tutorial/web-embeds#webviews)            | Host Renderer     | [`ipcRenderer`](https://www.electronjs.org/docs/api/ipc-renderer) | `sendToHost`       |

> Note: _Embedded_ specifically refer to `<webview/>` tags here, therefore, _Embedded_ and _Host_ _Renderer_`s are a subset of more general _Renderer_ processes.

### Incoming Message Marks

| Sender Process    | Receiver Process  | `IpcMark.Module` | `IpcMark.Method`   |
| ----------------- | ----------------- | ---------------- | ------------------ |
| Main              | Renderer          | `ipcRenderer`    | `emit`             |
| Renderer          | Main              | `ipcMain`        | `emit`             |
| Renderer          | Renderer          | `ipcRenderer`    | `emit`             |
| Host Renderer     | Embedded Renderer | `ipcRenderer`    | `emit`             |
| Embedded Renderer | Host Renderer     | `ipcRenderer`    | `addEventListener` |

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
