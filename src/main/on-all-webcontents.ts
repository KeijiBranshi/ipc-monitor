import { app, webContents, WebContents } from "electron";
import { Observable } from "rxjs/Observable";
import { defer } from "rxjs/observable/defer";
import { fromEvent } from "rxjs/observable/fromEvent";
import { IpcMark } from "common/types";

function onAllWebContents(
  observableFactory: (contents: WebContents) => Observable<IpcMark>
): Observable<IpcMark> {
  const newWebContents = fromEvent(
    app,
    "web-contents-created",
    (_event, wc: WebContents) => wc
  );

  const mergedMonitors = defer(() => {
    // use defer() so that webContents.getAllWebContents() isnt stale
    return newWebContents
      .startWith(...webContents.getAllWebContents())
      .mergeMap((contents) => {
        // map each WebContents to an ipcMonitor (on their .send() functions)
        const contentsDestroyed = fromEvent<void>(contents, "destroyed");

        const observable = observableFactory(contents);

        return observable.takeUntil(contentsDestroyed);
      });
  });

  return mergedMonitors;
}

export default onAllWebContents;
