
export interface IndexedTreeNode {
  score: number;
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
  public setWins(sequence: T[], score: number): void {
    const node = this.getNode(sequence);
    if (node) node.score = score;
  }

  /** 全ノードをクリア */
  public clear(): void {
    const dfs = (node: IndexedTreeNode): void => {
      node.score = 0;
      for (const child of node.children) dfs(child);
    };
    dfs(this.root);
  }
}
