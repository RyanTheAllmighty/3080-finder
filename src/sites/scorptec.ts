import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';
import { getNewPage } from '../utils/browser';

class Scorptec implements Scannable {
    url = 'https://www.scorptec.com.au/product/graphics-cards/geforcertx3080';

    async scan(browser: Browser) {
        const page = await getNewPage(browser);
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('#product_list');
        const items = await page.$$('#product_list .inner-detail');

        for await (const item of items) {
            const productNameElement = await item.$('.item_short_intro');
            const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);

            const urlElement = await item.$('.desc > a');
            const url = await page.evaluate((el) => el.href, urlElement);

            const productModelNumberElement = await item.$('.item_model');
            const productModelNumber = await page.evaluate((el) => el.textContent.trim(), productModelNumberElement);

            const productPriceElement = await item.$('.item_price');
            const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
            const productPrice = currency(productPriceString).value;

            const availabilityElement = await item.$('.stock');
            const availability = await page.evaluate(
                (el) =>
                    el.textContent
                        .trim()
                        .replaceAll('\n', '')
                        .replace('Order OnlySOLD OUT', 'Order Only SOLD OUT')
                        .replace('SOLD OUTSOLD OUT', 'SOLD OUT SOLD OUT'),
                availabilityElement,
            );

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

export default Scorptec;
