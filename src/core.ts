import type { Browser } from 'puppeteer';

export interface Card {
    name: String;
    productNumber: String;
    price: Number;
    availability: String;
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

    scan: (browser: Browser) => Promise<ScanResult>;
}
