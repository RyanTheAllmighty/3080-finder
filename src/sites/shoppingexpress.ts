import config from 'config';
import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';

class ShoppingExpress implements Scannable {
    url = 'https://www.shoppingexpress.com.au/nvidia-geforce?rf=&viewby=list';

    async scan(browser: Browser) {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(config.get<number>('timeout'));
        page.setDefaultTimeout(config.get<number>('timeout'));
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.wrapper-row-thumbnail');
        const items = await page.$$('.wrapper-row-thumbnail .panel-body');

        for await (const item of items) {
            const productNameElement = await item.$('.thumblist-desc a');
            const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);
            const url: string = await page.evaluate((el) => el.href, productNameElement);

            if (!productName.includes('3080')) {
                continue;
            }

            const productModelNumber = url.substr(url.lastIndexOf('/') + 1);

            const productPriceElement = await item.$('.price');
            const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
            const productPrice = currency(productPriceString).value;

            const availabilityElement = await item.$('.availability_description');
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

export default ShoppingExpress;
