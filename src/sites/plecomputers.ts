import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';
import { getNewPage } from '../utils/browser';

class PLEComputers implements Scannable {
    url = 'https://www.ple.com.au/Categories/1152/Graphics-Cards/Nvidia-GeForce/RTX30-Series3080';

    async scan(browser: Browser) {
        const page = await getNewPage(browser);
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.itemGridWrapper');
        const items = await page.$$('.itemGridWrapper .tileStandard');

        for await (const item of items) {
            const productNameElement = await item.$('.itemGridTileDescription');
            const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);

            const urlElement = await item.$('a');
            const url = await page.evaluate((el) => el.href, urlElement);

            const productModelNumberElement = await item.$('.itemGridTileModel');
            const productModelNumber = await page.evaluate((el) => el.textContent.trim(), productModelNumberElement);

            const productPriceElement = await item.$('.itemGridTilePriceActual');
            const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
            const productPrice = currency(productPriceString).value;

            const availabilityElement = await item.$('.itemGridTileAvailabilitiesContainer');
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

export default PLEComputers;
