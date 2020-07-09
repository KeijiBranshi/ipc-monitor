import { Observable, Observer, Subscription } from "rxjs";
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
