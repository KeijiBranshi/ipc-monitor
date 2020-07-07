import { Observable } from "rxjs/Observable";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/startWith";

import { IpcMark, IpcMetric } from "../common/types";

export type MessageCountData = {
  count: number;
};

export function outgoingMessageCount(): IpcMetric<MessageCountData> {
  return (monitor: Observable<IpcMark>) => {
    return monitor
      .filter(({ type }) => type === "outgoing")
      .map((_, index) => ({
        count: index + 1,
      }))
      .startWith({
        count: 0,
      });
  };
}

export function incomingMessageCount(): IpcMetric<MessageCountData> {
  return (monitor: Observable<IpcMark>) => {
    return monitor
      .filter(({ type }) => type === "incoming")
      .map((_, index) => ({
        count: index + 1,
      }))
      .startWith({
        count: 0,
      });
  };
}
