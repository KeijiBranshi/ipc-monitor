import { Observable, Observer, Subscription } from "rxjs";
import { IpcMark } from "./types";

type TeardownLogic = (() => void) | (() => Subscription);
type MonitorOptions = {
  wrap: (monitorObserver: Observer<IpcMark>) => TeardownLogic;
};

export default function createMonitor({
  wrap,
}: MonitorOptions): Observable<IpcMark> {
  return Observable.create(wrap).share();
}
