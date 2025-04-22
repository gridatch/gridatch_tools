import { MultisetPermutation } from "../types/simulation";

export interface IndexedTreeNode {
  score: number;
  probability: number;
  children: IndexedTreeNode[];
}

export class IndexedTree<T extends string> {
  public readonly root: IndexedTreeNode;
  private readonly domains: T[];
  private readonly maxDepth: number;

  constructor(domains: T[], maxDepth: number) {
    this.domains = domains;
    this.maxDepth = maxDepth;
    this.root = this.buildNode(0);
  }

  private buildNode(depth: number): IndexedTreeNode {
    const node: IndexedTreeNode = {
      score: 0,
      probability: 0,
      children: []
    };
    if (depth < this.maxDepth) {
      for (let i = 0; i < this.domains.length; ++i) {
        node.children[i] = this.buildNode(depth + 1);
      }
    }
    return node;
  }

  private getNode(sequence: T[]): IndexedTreeNode | null {
    let node = this.root;
    for (const key of sequence) {
      const idx = this.domains.indexOf(key);
      if (idx < 0 || idx >= node.children.length) return null;
      node = node.children[idx];
    }
    return node;
  }

  /**
   * 引数の各順列に対応する各ノードに、順列の通り数を設定する
   */
  public loadPermutations(perms: MultisetPermutation<T>[]): void {
    // 末端ノードへ順列の通り数を設定
    for (const { tiles, probability } of perms) {
      const node = this.getNode(tiles);
      if (node) {
        node.probability = probability;
      }
    }
  }

  /** ノードのスコアを取得 */
  public getScore(sequence: T[]): number {
    let node = this.root;
    let bestScore = node.score;
    for (const key of sequence) {
      const idx = this.domains.indexOf(key);
      if (idx < 0 || idx >= node.children.length) return bestScore;
      node = node.children[idx];
      if (node.score > bestScore) bestScore = node.score;
    }
    return bestScore;
  }

  /** ノードにスコアを設定する */
  public setScore(sequence: T[], score: number): void {
    const node = this.getNode(sequence);
    if (node) node.score = score;
  }

  /** 全ノードをクリア */
  public clear(): void {
    const dfs = (node: IndexedTreeNode): void => {
      node.score = 0;
      node.probability = 0;
      for (const child of node.children) dfs(child);
    };
    dfs(this.root);
  }
}
