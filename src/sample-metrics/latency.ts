import { Observable } from "rxjs/Observable";
import { empty } from "rxjs/observable/empty";
import { zip } from "rxjs/observable/zip";
import { GroupedObservable } from "rxjs/operator/groupBy";
import "rxjs/add/operator/groupBy";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/take";
import "rxjs/add/operator/count";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/pluck";
import "rxjs/add/operator/scan";

import { IpcMark, IpcMetric } from "../common/types";

type Time = number;
type LatencyData = {
  latency: number;
  method: string;
  channel: string;
  // TODO: add payload size
};
export function latencies(): IpcMetric<LatencyData> {
  return (monitor: Observable<IpcMark>) => {
    return monitor
      .groupBy((mark) => mark.correlationId)
      .mergeMap(
        (
          correlatedMarks: GroupedObservable<string | "unknown", IpcMark>
        ): Observable<LatencyData> => {
          const correlationId = correlatedMarks.key;
          if (correlationId === "unknown") {
            return empty<LatencyData>();
          }
          const sendInfo = correlatedMarks.filter(
            ({ type }) => type === "outgoing"
          );

          const sendTime: Observable<Time> = sendInfo.pluck("time");
          const receiveTime: Observable<Time> = correlatedMarks
            .filter(({ type }) => type === "incoming")
            .pluck("time");

          const messageLatency: Observable<Time> = zip(sendTime, receiveTime)
            .map(([sent, received]) => received - sent)
            .take(1);

          return zip(
            messageLatency,
            sendInfo.pluck<IpcMark, string>("channel"),
            sendInfo.pluck<IpcMark, string>("method")
          ).map(([latency, channel, method]) => ({
            latency,
            channel,
            method,
          }));
        }
      );
  };
}

export function averageLatencies(): IpcMetric<{
  averageLatency: number;
  count: number;
}> {
  function computeUpdatedAverage(
    currentAverage: number,
    nextValue: number,
    previousWeight: number
  ) {
    return (currentAverage * previousWeight + nextValue) / (previousWeight + 1);
  }

  return (monitor: Observable<IpcMark>) => {
    const latencyMetric = latencies();
    return latencyMetric(monitor)
      .map(({ latency }) => latency)
      .scan(computeUpdatedAverage, 0)
      .map((averageLatency, index) => ({ averageLatency, count: index + 1 }))
      .startWith({ averageLatency: 0, count: 0 });
  };
}
