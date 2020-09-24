import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';
import { getNewPage } from '../utils/browser';
import logger from '../utils/logger';

class Centrecom implements Scannable {
    url = 'https://www.centrecom.com.au/products?q=rtx%203080';

    async scan(browser: Browser) {
        const page = await getNewPage(browser);
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.product-grid');
        const items = await page.$$('.product-grid .prbox_box');

        await Promise.allSettled(
            items.map((item) => {
                return new Promise(async (resolve) => {
                    const productNameElement = await item.$('.prbox_name');
                    const productName: string = await page.evaluate((el) => el.textContent.trim(), productNameElement);

                    const urlElement = await item.$('.prbox_link');
                    const url: string = await page.evaluate((el) => el.href, urlElement);

                    if (productName.includes('Gaming System')) {
                        resolve();
                        return;
                    }

                    const productPriceElement = await item.$('.saleprice');
                    const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
                    const productPrice = currency(productPriceString).value;

                    try {
                        const productPage = await getNewPage(browser);
                        await productPage.goto(url);
                        await productPage.waitForSelector('.cc-page');

                        const productModelNumberElement = await productPage.$('.product-code :nth-child(2)');
                        const productModelNumber = await productPage.evaluate(
                            (el) => el.textContent.trim(),
                            productModelNumberElement,
                        );

                        const availabilityElement = await productPage.$('.prod_right');
                        const availability: string = await productPage.evaluate(
                            (el) => el.textContent.trim().replaceAll('\n', ''),
                            availabilityElement,
                        );

                        await productPage.close();

                        cards.push({
                            name: productName,
                            productNumber: productModelNumber,
                            price: productPrice,
                            availability,
                            url,
                        });
                    } catch (e) {
                        logger.error(
                            `Error when scanning ${productName} from ${this.constructor.name} - ${
                                e?.message || 'Unknown error'
                            }`,
                        );
                        resolve();
                    }

                    resolve();
                });
            }),
        );

        await page.close();

        return {
            cards,
        };
    }
}

export default Centrecom;
