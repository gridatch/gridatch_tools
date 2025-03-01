
export interface HandState {
  sequenceCount: number;
  tripletCount: number;
  hasPair: boolean;
  singles: { [tile: string]: number };
}

export interface HandComponent {
  type: "sequence" | "triplet" | "pair" | "convertedPair" | "single";
  tiles: string[];
  tileCount: number;
}

export interface ManmanCsvRow {
  loss: number;
  key: string;
  breakdown: string;
}

export interface ManmanCsvData {
  [tileCount: string]: {
    [key: string]: ManmanCsvRow;
  };
}

export interface TenpaiResult {
  loss: number;
  key: string;
  breakdown: string;
  hand: HandComponent[];
}