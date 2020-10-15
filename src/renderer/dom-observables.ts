import { WebviewTag } from "electron";
import { Observable } from "rxjs/Observable";
import { defer } from "rxjs/observable/defer";
import { fromEvent } from "rxjs/observable/fromEvent";
import { of } from "rxjs/observable/of";
import { _throw as throwError } from "rxjs/observable/throw";
import { Observer } from "rxjs/Observer";

import "rxjs/add/operator/filter";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/take";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/switchMap";

export function onDomMutations(
  target: Node = document?.documentElement,
  config: MutationObserverInit = { subtree: true, childList: true }
): Observable<MutationRecord> {
  if (!target) {
    return throwError(
      new Error("DOM Mutations Observable: Node DOM Target Provided")
    );
  }

  return Observable.create((observer: Observer<MutationRecord>) => {
    const mutation = new MutationObserver((mutationRecords) =>
      mutationRecords.map((m) => observer.next(m))
    );
    mutation.observe(target, config);
    return function unsubscribe() {
      mutation.disconnect();
    };
  });
}

const whenDomReady: Observable<void> = defer(() => {
  if (typeof window === "undefined") {
    return throwError(new Error("Global Window not present"));
  }
  if (typeof document === "undefined") {
    return throwError(new Error("Global Document not present"));
  }
  if (document?.readyState === "complete") {
    return of<void>();
  }

  return fromEvent<void>(window, "load");
}).take(1);

function extractWebviewElements(nodes: NodeList): WebviewTag[] {
  return [...nodes.values()]
    .filter((node) => node instanceof HTMLElement && node.tagName === "WEBVIEW")
    .map((node) => node as WebviewTag);
}

export default function onWebviews(): Observable<WebviewTag> {
  return whenDomReady.switchMap(() => {
    const preExistingWebviews = extractWebviewElements(
      document.querySelectorAll("webview")
    );
    return onDomMutations()
      .filter((mutation) => mutation?.addedNodes !== undefined)
      .mergeMap((mutation) => extractWebviewElements(mutation.addedNodes))
      .startWith(...preExistingWebviews);
  });
}
