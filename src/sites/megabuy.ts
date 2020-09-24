import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';
import { getNewPage } from '../utils/browser';

class MegaBuy implements Scannable {
    url =
        'https://www.megabuy.com.au/advanced_search.html?keywords=rtx+3080&categories_id=&manufacturers_id=&pfrom=&pto=&sort=1d';

    async scan(browser: Browser) {
        const page = await getNewPage(browser);
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.productListing');
        const items = await page.$$('.productListing .productListingRow, .productListing .productListingRowAlt');

        for await (const item of items) {
            const productNameElement = await item.$('.nameDescription > a');
            const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);
            const url = await page.evaluate((el) => el.href, productNameElement);

            const productModelNumberElement = await item.$('.nameDescription .code');
            const productModelNumber = await page.evaluate((el) => el.textContent.trim(), productModelNumberElement);

            const productPriceElement = await item.$('.productPrice');
            const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
            const productPrice = currency(productPriceString).value;

            const availabilityElement = await item.$('.stockAvailabilities');
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

export default MegaBuy;
