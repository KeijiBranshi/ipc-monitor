import { Observable } from "rxjs/Observable";
import { _throw as throwError } from "rxjs/observable/throw";
import { Observer } from "rxjs/Observer";
import { Subscription } from "rxjs/Subscription";
import { IpcMark } from "./types";

import "rxjs/add/operator/share";

type TeardownLogic = (() => void) | (() => Subscription);
type MonitorOptions = {
  wrap: (monitorObserver: Observer<IpcMark>) => TeardownLogic;
};

export default function createMonitor({
  wrap,
}: MonitorOptions): Observable<IpcMark> {
  if (!wrap) {
    return throwError(
      new Error("No IPC wrapper provided to Observable constructor")
    );
  }
  return Observable.create(wrap).share();
}
