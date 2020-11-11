import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';
import { getNewPage } from '../utils/browser';

class BudgetPC implements Scannable {
    url = 'https://www.bpctech.com.au/catalogsearch/result/index/?cat=21&q=3080&product_list_limit=36';

    async scan(browser: Browser) {
        const page = await getNewPage(browser);
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.category-product-list .product-item');
        const items = await page.$$('.category-product-list .product-item');

        for await (const item of items) {
            const productNameElement = await item.$('.product-item-link');
            const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);
            const url: string = await page.evaluate((el) => el.href, productNameElement);

            const productModelNumberElement = await item.$('.proudctListProductSku');
            const productModelNumber = await page.evaluate(
                (el) => el.textContent.replace('SKU:', '').trim(),
                productModelNumberElement,
            );

            const productPriceElement = await item.$('.price');
            const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
            const productPrice = currency(productPriceString).value;

            const availabilityElement = await item.$('.stock');
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

export default BudgetPC;
