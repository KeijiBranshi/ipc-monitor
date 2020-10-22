import { v4 as uuid } from "node-uuid";
import { Observer } from "rxjs/Observer";
import {
  IpcMark,
  MarkFn,
  FunctionMapper,
  SendFn,
  EmitFn,
  IpcMethod,
  IpcModule,
} from "./types";

/** "Random" string to distinguish correlation ids included with incoming messages. Kind of a hack, but...eh */
const CorrelationIdSeparator = "4fabcc09-0ddf-495a-9d0f-c17d4290e42a";

export function extractCorrelationId(...args: any[]): string | "unknown" {
  if (args.length < 2) {
    return "unknown";
  }

  const n = args.length;
  const separator = args[n - 2];
  const correlationId = args[n - 1];

  return separator === CorrelationIdSeparator ? correlationId : "unknown";
}

export type MarkerOptions = {
  sink: Observer<IpcMark>;
  module: IpcModule;
  method: IpcMethod | string;
};

/**
 * Helper function to create an IPC marker (ie timestamper). This is needed
 * because Main and Renderer processes may use different implementations of
 * the `performance` and `uuid` APIs. Additionally, it gives more flexibility
 * on the process to decide the Observer (ie sink) implementation for the marks
 */
export function createMarker({ sink, module, method }: MarkerOptions): MarkFn {
  return function mark(
    type: "outgoing" | "incoming",
    channel: string,
    correlationId: string = uuid(),
    time: number = Date.now()
  ): string {
    // Execute on different Event Loop to avoid blocking executiong
    // of the caller
    setTimeout(() => {
      try {
        sink.next({ type, channel, time, correlationId, method, module });
      } catch (e) {
        sink.error(e);
      }
    }, 0);
    return correlationId;
  };
}

type AnyFunction = (...args: any[]) => any;
export function createFunctionWrappers(
  mark: ReturnType<typeof createMarker>
): [any, any] {
  const wrapOutgoingMessages = (originalSend: SendFn): SendFn => {
    // return a new version of the ipc.send method
    return (...originalArgs: any[]): any => {
      const [channel, ...args] = originalArgs;
      const correlationId = mark("outgoing", channel);
      // add the correlation id as the last argument
      // (to hide it from the original handler on the other end)
      /* eslint-disable-next-line consistent-return */
      return originalSend(
        channel,
        ...args,
        CorrelationIdSeparator,
        correlationId
      );
    };
  };
  const wrapIncomingMessages = (originalEmit: EmitFn): EmitFn => {
    return (...originalArgs: Parameters<EmitFn>) => {
      const [channel, ...args] = originalArgs as [string, ...any[]];
      const correlationId = extractCorrelationId(...args);
      mark("incoming", channel.toString(), correlationId);

      return originalEmit(...originalArgs);
    };
  };

  return [wrapOutgoingMessages, wrapIncomingMessages];
}
