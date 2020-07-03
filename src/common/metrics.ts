import { Observable } from "rxjs/Observable";
import { empty } from "rxjs/observable/empty";
import { zip } from "rxjs/observable/zip";
import { GroupedObservable } from "rxjs/operator/groupBy";
import { IpcMark } from "common/types";

import "rxjs/add/operator/groupBy";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/take";
import "rxjs/add/operator/count";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/pluck";
import "rxjs/add/operator/scan";

export type IpcMetric<T> = (source: Observable<IpcMark>) => Observable<T>;

export function combineMetrics<A>(m0: IpcMetric<A>): [IpcMetric<A>];
export function combineMetrics<A, B>(
  m0: IpcMetric<A>,
  m1: IpcMetric<B>
): [IpcMetric<A>, IpcMetric<B>];
export function combineMetrics<A, B, C>(
  m0: IpcMetric<A>,
  m1: IpcMetric<B>,
  m2: IpcMetric<C>
): [IpcMetric<A>, IpcMetric<B>, IpcMetric<C>];
export function combineMetrics<A, B, C, D>(
  m0: IpcMetric<A>,
  m1: IpcMetric<B>,
  m2: IpcMetric<C>,
  m3: IpcMetric<D>
): [IpcMetric<A>, IpcMetric<B>, IpcMetric<C>, IpcMetric<D>];
export function combineMetrics<A, B, C, D, E>(
  m0: IpcMetric<A>,
  m1: IpcMetric<B>,
  m2: IpcMetric<C>,
  m3: IpcMetric<D>,
  m4: IpcMetric<E>
): [IpcMetric<A>, IpcMetric<B>, IpcMetric<C>, IpcMetric<D>, IpcMetric<E>];

/**
 * Helper function to help map to concrete Tuple types
 */
export function combineMetrics(
  ...metrics: IpcMetric<unknown>[]
): IpcMetric<unknown>[] {
  return [...metrics];
}

export function departureCount(): IpcMetric<{ departures: number }> {
  return (monitor: Observable<IpcMark>) => {
    return monitor
      .filter(({ type }) => type === "outgoing")
      .map((_, index) => ({
        departures: index + 1,
      }));
  };
}

export function arrivalCount(): IpcMetric<{ arrivals: number }> {
  return (monitor: Observable<IpcMark>) => {
    return monitor
      .filter(({ type }) => type === "incoming")
      .map((_, index) => ({
        arrivals: index + 1,
      }));
  };
}

type Time = number;
type LatencyInfo = {
  latency: number;
  method: string;
  channel: string;
};
export function latencies(): IpcMetric<LatencyInfo> {
  return (monitor: Observable<IpcMark>) => {
    return monitor
      .groupBy((mark) => mark.correlationId)
      .mergeMap(
        (
          correlatedMarks: GroupedObservable<string | "unknown", IpcMark>
        ): Observable<LatencyInfo> => {
          const correlationId = correlatedMarks.key;
          if (correlationId === "unknown") {
            return empty<LatencyInfo>();
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
