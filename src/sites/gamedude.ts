import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';
import { getNewPage } from '../utils/browser';

class GameDude implements Scannable {
    url = 'https://www.gamedude.com.au/products/nvidia-3080';

    async scan(browser: Browser) {
        const page = await getNewPage(browser);
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.hikashop_products');
        const items = await page.$$('.hikashop_products .hikashop_product');

        for await (const item of items) {
            const productNameElement = await item.$('.hikashop_product_name > a');
            const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);
            const url = await page.evaluate((el) => el.href, productNameElement);

            const productModelNumberElement = await item.$('.hikashop_product_code_list');
            const productModelNumber = await page.evaluate((el) => el.textContent.trim(), productModelNumberElement);

            const productPriceElement = await item.$('.hikashop_product_price');
            const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
            const productPrice = currency(productPriceString).value;

            let availability = 'In Stock';
            const availabilityElement = await item.$('.hikashop_product_badge_image');
            if (availabilityElement) {
                availability = await page.evaluate((el) => el.title.trim(), availabilityElement);
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

export default GameDude;
