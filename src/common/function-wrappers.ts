import { Observer } from "rxjs/Observer";
import {
  IpcMark,
  UuidGenerator,
  MarkFn,
  FunctionMapper,
  SendFn,
  EmitFn,
} from "common/types";

/** "Random" string to distinguish correlation ids included with incoming messages */
const CorrelationIdSeparator = "4fabcc09-0ddf-495a-9d0f-c17d4290e42a";

function extractCorrelationId(...args: any[]): string | "unknown" {
  if (args.length < 2) {
    return "unknown";
  }

  const n = args.length;
  const separator = args[n - 2];
  const correlationId = args[n - 1];

  return separator === CorrelationIdSeparator ? correlationId : "unknown";
}

export type MarkerOptions = {
  uuid: UuidGenerator;
  sink: Observer<IpcMark>;
};

/**
 * Helper function to create an IPC marker (ie timestamper). This is needed
 * because Main and Renderer processes may use different implementations of
 * the `performance` and `uuid` APIs. Additionally, it gives more flexibility
 * on the process to decide the Observer (ie sink) implementation for the marks
 */
export function createMarker({ uuid, sink }: MarkerOptions): MarkFn {
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
        /* eslint:disable-next-line no-unused-expression */
        sink.next({ type, channel, time, correlationId });
      } catch (e) {
        sink.error(e);
      }
    }, 0);
    return correlationId;
  };
}

type WrapperOptions = {
  mark: ReturnType<typeof createMarker>;
};
export function createFunctionWrappers({
  mark,
}: WrapperOptions): [FunctionMapper<SendFn>, FunctionMapper<EmitFn>] {
  const wrapOutgoingMessages = (
    originalSend: SendFn,
    safeToSend: () => boolean = () => true
  ): SendFn => {
    // return a new version of the ipc.send method
    return (...originalArgs: Parameters<SendFn>): ReturnType<SendFn> => {
      if (!safeToSend()) {
        return;
      }

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
  const wrapIncomingMessages = (
    originalEmit: EmitFn,
    safeToEmit: () => boolean = () => true
  ): EmitFn => {
    return (...originalArgs: Parameters<EmitFn>) => {
      if (!safeToEmit()) {
        return false;
      }

      const [channel, ...args] = originalArgs as [string, ...any[]];
      const correlationId = extractCorrelationId(...args);
      mark("incoming", channel.toString(), correlationId);

      return originalEmit(...originalArgs);
    };
  };

  return [wrapOutgoingMessages, wrapIncomingMessages];
}
