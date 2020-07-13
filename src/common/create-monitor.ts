import { Observable } from "rxjs/Observable";
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
  return Observable.create(wrap).share();
}
