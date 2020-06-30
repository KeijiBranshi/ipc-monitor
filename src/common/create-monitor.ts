import { Observable, Observer, Subscription } from "rxjs";
import { IpcMark } from "common/types";

type TeardownLogic = (() => void) | (() => Subscription);
export default function createMonitor({
  wrap,
}: {
  wrap: (monitorObserver: Observer<IpcMark>) => TeardownLogic;
}): Observable<IpcMark> {
  return Observable.create(wrap).share();
}
