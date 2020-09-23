import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';
import { getNewPage } from '../utils/browser';

class AustinComputers implements Scannable {
    url = 'https://www.austin.net.au/search/?q=3080';

    async scan(browser: Browser) {
        const page = await getNewPage(browser);
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('#kuLandingProductsListUl');
        const items = await page.$$('#kuLandingProductsListUl li');

        for await (const item of items) {
            const productNameElement = await item.$('.kuName > a');
            const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);
            const url: string = await page.evaluate((el) => el.href, productNameElement);

            if (!productName.includes('3080')) {
                continue;
            }

            const productModelNumber = url.substr(url.lastIndexOf('/') + 1);

            const productPriceElement = await item.$('.kuSalePrice');
            const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
            const productPrice = currency(productPriceString).value;

            let availability = 'In Stock';
            const availabilityElement = await item.$('.klevu-out-of-stock');
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

export default AustinComputers;
