import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';
import { getNewPage } from '../utils/browser';
import logger from '../utils/logger';

class AustinComputers implements Scannable {
    url = 'https://www.austin.net.au/search/?q=rtx+3080';

    async scan(browser: Browser) {
        const page = await getNewPage(browser);
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('#kuLandingProductsListUl');
        const items = await page.$$('#kuLandingProductsListUl li');

        await Promise.allSettled(
            items.map((item) => {
                return new Promise(async (resolve) => {
                    const productNameElement = await item.$('.kuName > a');
                    const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);
                    const url: string = await page.evaluate((el) => el.href, productNameElement);

                    if (!productName.includes('3080')) {
                        resolve();
                    }

                    const productModelNumber = url.substr(url.lastIndexOf('/') + 1);

                    const productPriceElement = await item.$('.kuSalePrice');
                    const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
                    const productPrice = currency(productPriceString).value;

                    try {
                        const productPage = await getNewPage(browser);
                        await productPage.goto(url);
                        await productPage.waitForSelector('.inventory-section');

                        const availabilityElement = await productPage.$('.inventory-section div:nth-child(3)');
                        const availability = await productPage.evaluate(
                            (el) => el.textContent.trim(),
                            availabilityElement,
                        );

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

export default AustinComputers;
