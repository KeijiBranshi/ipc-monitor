import { IpcRenderer, IpcMain, WebContents } from "electron";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";

export type IpcMark = {
  type: "outgoing" | "incoming";
  time: number;
  correlationId: string;
  channel?: string;
  method?: keyof IpcRenderer | keyof IpcMain | keyof WebContents;
};

export type IpcMonitor = Observable<IpcMark>;

/**
 * Helper Types
 */
export type MarkFn = (
  type: "outgoing" | "incoming",
  channel: string,
  correlationId?: string,
  time?: number
) => string;
export type SendFn = IpcRenderer["send"] | WebContents["send"];
export type EmitFn = IpcRenderer["emit"] | IpcMain["emit"];
export type IpcMainListener = Parameters<IpcMain["on"]>;

export type Cleanup = () => void;
export type ObservableConstructor<T> = (observer: Observer<T>) => Cleanup;
export type FunctionMapper<T> = (fn: T, predicate?: () => boolean) => T;

export type UuidGenerator = () => string;
