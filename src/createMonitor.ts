import { Observable } from "rxjs";

export default function createMonitor({
  wrap,
}: {
  wrap: () => () => void;
}): Observable<Record<string, string>> {
  return Observable.create(wrap).share();
}
