

class TrieNode<T extends string> {
  public visited: boolean = false;
  public children: Map<T, TrieNode<T>> = new Map();
}

/**
 * Trie（前方一致木）クラス
 */
export class Trie<T extends string> {
  private root = new TrieNode<T>();

  /**
   * 指定したシーケンスを「訪問済み」とマークする。
   */
  public mark(sequence: T[]): void {
    let node = this.root;
    for (const item of sequence) {
      if (node.visited) {
        return;
      }
      let child = node.children.get(item);
      if (!child) {
        child = new TrieNode<T>();
        node.children.set(item, child);
      }
      node = child;
    }
    node.visited = true;
  }

  /**
   * 指定したシーケンスが既に「訪問済み」かを判定する。
   */
  public isVisited(sequence: T[]): boolean {
    let node = this.root;
    for (const item of sequence) {
      if (node.visited) {
        return true;
      }
      const child = node.children.get(item);
      if (!child) {
        return false;
      }
      node = child;
    }
    return node.visited;
  }

  /**
   * Trieをクリア
   */
  public clear(): void {
    this.root = new TrieNode<T>();
  }
}