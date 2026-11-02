/** The deadline includes response body parsing, even when a provider ignores abort. */
export async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  ms: number,
  external?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort = () => {};
  const deadline = new Promise<never>((_, reject) => {
    onAbort = () => {
      controller.abort();
      reject(new Error("Request cancelled"));
    };
    external?.addEventListener("abort", onAbort, { once: true });
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("Request timed out"));
    }, ms);
  });
  try {
    if (external?.aborted) throw new Error("Request cancelled");
    return await Promise.race([operation(controller.signal), deadline]);
  } finally {
    clearTimeout(timer);
    external?.removeEventListener("abort", onAbort);
  }
}
