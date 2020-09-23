import config from 'config';
import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';

class IJK implements Scannable {
    url =
        'https://www.ijk.com.au/branch/ijk/advanced_search_result.php?search_in_description=0&inc_subcat=1&keywords=rtx+3080&x=0&y=0&manufacturers_id=';

    async scan(browser: Browser) {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(config.get<number>('timeout'));
        page.setDefaultTimeout(config.get<number>('timeout'));
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.productListing');
        const items = await page.$$('.productListing .productListing-even, .productListing .productListing-odd');

        for await (const item of items) {
            const productNameElement = await item.$('.productListing-data:nth-child(1) > a');
            const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);
            const url: string = await page.evaluate((el) => el.href, productNameElement);

            const productModelNumberElement = await item.$('.productListing-data:nth-child(3) > a');
            const productModelNumber = await page.evaluate((el) => el.textContent.trim(), productModelNumberElement);

            const productPriceElement = await item.$('.productListing-data:nth-child(7)');
            const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
            const productPrice = currency(productPriceString).value;

            const availabilityElement = await item.$('.productListing-data:nth-child(6)');
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

export default IJK;
