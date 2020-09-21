export interface Card {
    name: String;
    productNumber: String;
    price: Number;
    availability?: Date;
    url: String;
    stockStore?: Number;
    stockSupplier?: Number;
}

export interface CardDBRecord extends Card {
    scanner: String;
}

export interface ScanResult {
    cards: Card[];
}

export interface Scannable {
    url: string;

    scan: () => Promise<ScanResult>;
}
