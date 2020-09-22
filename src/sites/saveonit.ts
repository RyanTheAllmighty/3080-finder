import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';

class SaveOnIt implements Scannable {
    url = 'https://www.saveonit.com.au/searches?searchbox=rtx3080';

    async scan(browser: Browser) {
        const page = await browser.newPage();
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.grid-list');
        const items = await page.$$('.grid-list li');

        for await (const item of items) {
            const productNameElement = await item.$('.title > a');
            const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);
            const url: string = await page.evaluate((el) => el.href, productNameElement);

            const productModelNumber = url.substr(url.lastIndexOf('/') + 1);

            const productPriceElement = await item.$('.cart-section > .grd-btn > strong');
            const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
            const productPrice = currency(productPriceString).value;

            const availabilityElement = await item.$('.stockqty > p');
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

export default SaveOnIt;
