import config from 'config';
import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';

class ComputerAlliance implements Scannable {
    url = 'https://www.computeralliance.com.au/RTX-30-Series';

    async scan(browser: Browser) {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(config.get<number>('timeout'));
        page.setDefaultTimeout(config.get<number>('timeout'));
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('#main');
        const items = await page.$$('#main .product');

        for await (const item of items) {
            const productNameElement = await item.$('a > h2');
            const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);

            const urlElement = await item.$('a');
            const url = await page.evaluate((el) => el.href, urlElement);

            const productModelNumber = url.substr(url.lastIndexOf('/') + 1);

            const productPriceElement = await item.$('.price');
            const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
            const productPrice = currency(productPriceString).value;

            const availabilityElement = await item.$('.choose li');
            const availability = await page.evaluate((el) => el.textContent.trim(), availabilityElement);

            cards.push({
                name: productName,
                productNumber: productModelNumber,
                price: productPrice,
                availability,
                url,
            });
        }

        await page.close();

        return {
            cards,
        };
    }
}

export default ComputerAlliance;
