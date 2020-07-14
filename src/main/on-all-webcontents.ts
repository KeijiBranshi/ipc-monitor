import { app, webContents, WebContents } from "electron";
import { Observable } from "rxjs/Observable";
import { concat } from "rxjs/observable/concat";
import { defer } from "rxjs/observable/defer";
import { from } from "rxjs/observable/from";
import { fromEvent } from "rxjs/observable/fromEvent";
import { _throw as throwError } from "rxjs/observable/throw";

function onAllWebContents(): Observable<WebContents> {
  if (!(webContents || app)) {
    return throwError("Unable to detect webContents in this process");
  }

  const newWebContents = fromEvent(
    app,
    "web-contents-created",
    (_event, wc: WebContents) => wc
  );

  // use defer() so that webContents.getAllWebContents() isnt stale
  const allWebContents = defer(() => {
    const currentWebContents = from(webContents.getAllWebContents());
    return concat(currentWebContents, newWebContents);
  });

  return allWebContents;
}

export default onAllWebContents;
