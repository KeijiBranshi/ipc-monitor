import { IpcRenderer, IpcMain, WebContents, WebviewTag } from "electron";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";

export type IpcMethod =
  | keyof IpcRenderer
  | keyof IpcMain
  | keyof WebContents
  | keyof WebviewTag;
export type IpcMark = {
  type: "outgoing" | "incoming";
  time: number;
  correlationId: string;
  channel?: string;
  method?: IpcMethod;
};

export type IpcMonitor = Observable<IpcMark>;
export type IpcMetric<T> = (source: IpcMonitor) => Observable<T>;

/**
 * Helper Types
 */
export type MarkFn = (
  type: "outgoing" | "incoming",
  channel: string,
  method?: IpcMethod,
  correlationId?: string,
  time?: number
) => string;
export type SendFn =
  | IpcRenderer["send"]
  | WebContents["send"]
  | WebviewTag["send"];
export type EmitFn = IpcRenderer["emit"] | IpcMain["emit"];
export type IpcMainListener = Parameters<IpcMain["on"]>;

export type Cleanup = () => void;
export type ObservableConstructor<T> = (observer: Observer<T>) => Cleanup;
export type FunctionMapper<T> = (
  fn: T,
  method?: IpcMethod,
  predicate?: () => boolean
) => T;
