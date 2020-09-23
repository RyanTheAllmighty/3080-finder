import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';
import { getNewPage } from '../utils/browser';

class OnlineComputer implements Scannable {
    urls = [
        'https://www.onlinecomputer.com.au/120337',
        'https://www.onlinecomputer.com.au/120338',
        'https://www.onlinecomputer.com.au/120339',
    ];

    async scan(browser: Browser) {
        const cards: Card[] = [];

        await Promise.allSettled(
            this.urls.map((pageUrl) => {
                return new Promise(async (resolve) => {
                    const page = await getNewPage(browser);
                    await page.goto(pageUrl);

                    const productNameElement = await page.$('.wrapper-product-title > h1');
                    const productName: string = await page.evaluate((el) => el.textContent.trim(), productNameElement);

                    const productModelNumberElement = await page.$('.wrapper-product-title > p');
                    const productModelNumber = await page.evaluate(
                        (el) => el.textContent.trim(),
                        productModelNumberElement,
                    );

                    const productPriceElement = await page.$('.wrapper-pricing > div > div > .h1');
                    const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
                    const productPrice = currency(productPriceString).value;

                    const availabilityElement = await page.$('.wrapper-pricing > div > div:last-child > span');
                    const availability = await page.evaluate((el) => el.textContent.trim(), availabilityElement);

                    let stockSupplier;
                    const stockSupplierElement = await page.$('.wrapper-pricing > div > div:last-child > div');

                    if (stockSupplierElement) {
                        stockSupplier = parseInt(
                            await page.evaluate((el) => el.textContent.trim(), stockSupplierElement),
                            10,
                        );
                    }

                    cards.push({
                        name: productName,
                        productNumber: productModelNumber,
                        price: productPrice,
                        availability,
                        url: pageUrl,
                        stockSupplier,
                    });

                    resolve();
                });
            }),
        );

        return {
            cards,
        };
    }
}

export default OnlineComputer;
