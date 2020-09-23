import config from 'config';
import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';

class MWave implements Scannable {
    url = 'https://www.mwave.com.au/graphics-cards/geforce-rtx-3080?display=list';

    async scan(browser: Browser) {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(config.get<number>('timeout'));
        page.setDefaultTimeout(config.get<number>('timeout'));
        await page.goto(this.url);

        const cards: Card[] = [];

        const items = await page.$$('.productList .listItem');

        for await (const item of items) {
            const productNameElement = await item.$('.nameListView > a');
            const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);
            const url: string = await page.evaluate((el) => el.href, productNameElement);

            const productModelNumberElement = await item.$('.skumodel');
            const productModelNumber = await page.evaluate((el) => el.textContent.trim(), productModelNumberElement);

            const productPriceElement = await item.$('.price > .current');
            const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
            const productPrice = currency(productPriceString).value;

            let availability = 'Not in stock';
            const availabilityElement = await item.$('.normalTips');
            if (availabilityElement) {
                availability = await page.evaluate((el) => el.textContent.trim(), availabilityElement);
            }

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

export default MWave;
