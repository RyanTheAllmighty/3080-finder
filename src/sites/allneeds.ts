import config from 'config';
import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';
import { getNewPage } from '../utils/browser';

class AllNeeds implements Scannable {
    urls = [
        'https://allneeds.com.au/gigabyte-geforce-rtx-3080-gaming-oc-10gb',
        'https://allneeds.com.au/galax-geforce-rtx-3080-sg-1-click-oc-10gb-38nwm3md99nn',
        'https://allneeds.com.au/asus-geforce-rtx-3080-tuf-gaming-10gb',
        'https://allneeds.com.au/asus-geforce-rtx-3080-tuf-gaming-oc-10gb-tuf-rtx3080-o10g-gaming',
    ];

    async scan(browser: Browser) {
        const cards: Card[] = [];

        await Promise.allSettled(
            this.urls.map((pageUrl) => {
                return new Promise(async (resolve) => {
                    const page = await getNewPage(browser);
                    await page.goto(pageUrl);

                    const productNameElement = await page.$('.page-title');
                    const productName: string = await page.evaluate((el) => el.textContent.trim(), productNameElement);

                    const productModelNumberElement = await page.$('.product-info-stock-sku .sku > div');
                    const productModelNumber = await page.evaluate(
                        (el) => el.textContent.trim(),
                        productModelNumberElement,
                    );

                    const productPriceElement = await page.$('.product-info-price .price');
                    const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
                    const productPrice = currency(productPriceString).value;

                    const availabilityElement = await page.$('.product-info-stock-sku .stock');
                    const availability = await page.evaluate((el) => el.textContent.trim(), availabilityElement);

                    cards.push({
                        name: productName,
                        productNumber: productModelNumber,
                        price: productPrice,
                        availability,
                        url: pageUrl,
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

export default AllNeeds;
