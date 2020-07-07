import { Observable } from "rxjs/Observable";
import { IpcMark } from "../common/types";

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
