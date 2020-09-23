import config from 'config';
import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';

class PCByte implements Scannable {
    url =
        'https://www.pcbyte.com.au/store/category/pc-components-parts-computer-components-graphic-video-cards-2279?ppg=96&order=create_date+desc';

    async scan(browser: Browser) {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(config.get<number>('timeout'));
        page.setDefaultTimeout(config.get<number>('timeout'));
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.ict-catalog-item');
        const items = await page.$$('#products-grid .ict-catalog-item');

        for await (const item of items) {
            const productNameElement = await item.$('.product_name');
            const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);
            const url: string = await page.evaluate((el) => el.href, productNameElement);

            if (!productName.includes('3080')) {
                continue;
            }

            const productModelNumber = url.substr(url.lastIndexOf('/') + 1);

            const productPriceElement = await item.$('.list-price');
            const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
            const productPrice = currency(productPriceString).value;

            const tagElement = await item.$('.catalog-tag');
            const tag = await page.evaluate((el) => el.textContent.trim(), tagElement);

            const taglineElement = await item.$('.catalog-tagline');
            const tagline = await page.evaluate((el) => el.textContent.trim(), taglineElement);

            const availability = `${tag} - ${tagline}`;

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

export default PCByte;
