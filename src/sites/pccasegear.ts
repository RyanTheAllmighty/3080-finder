import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';

class PCCaseGear implements Scannable {
    url = 'https://www.pccasegear.com/category/193_2126/graphics-cards/geforce-rtx-3080';

    async scan(browser: Browser) {
        const page = await browser.newPage();
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.list-container');
        const items = await page.$$('.list-container .product-container');

        for await (const item of items) {
            const productNameElement = await item.$('.product-title');
            const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);
            const url: string = await page.evaluate((el) => el.href, productNameElement);

            const productModelNumber = url.substr(url.lastIndexOf('/') + 1);

            const productPriceElement = await item.$('.price');
            const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
            const productPrice = currency(productPriceString).value;

            const availabilityElement = await item.$('.stock-label');
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

export default PCCaseGear;
