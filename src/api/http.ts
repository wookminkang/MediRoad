/**
 * 공유 HTTP 래퍼 — 실API 연동 시 baseURL/헤더/에러 처리를 한 곳에서 관리.
 * 현재 MVP는 Mock repository를 쓰므로 아직 사용처는 없다(실API 전환 시 활성).
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function http<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    throw new HttpError(res.status, `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
