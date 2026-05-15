import { generateTree, type GenerateOptions } from "./generate";
import type { RawTree } from "./types";

export type MockFetchOptions = GenerateOptions & {
  /** ロード演出用ディレイ (ms) */
  delayMs?: number;
};

/**
 * 「サーバーから取ってきた」体のモック非同期ローダー。
 * リフレッシュ時に identity が変わることを確認したい #5 や、
 * UI state が server data 更新を超えて生き残ることを示したい #4 で使う。
 */
export function mockFetchTree(opts: MockFetchOptions = {}): Promise<RawTree> {
  const { delayMs = 200, ...rest } = opts;
  return new Promise((resolve) => {
    setTimeout(() => resolve(generateTree(rest)), delayMs);
  });
}
