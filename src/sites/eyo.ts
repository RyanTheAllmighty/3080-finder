import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';
import logger from '../utils/logger';

class EYO implements Scannable {
    url = 'https://www.eyo.com.au/search_results.php?search_term=3080&search_catid=4';

    async scan(browser: Browser) {
        const page = await browser.newPage();
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.tborder > tbody');
        const items = await page.$$('.tborder > tbody > tr:nth-child(n + 2)');

        await Promise.allSettled(
            items.map((item) => {
                return new Promise(async (resolve) => {
                    const productNameElement = await item.$(':nth-child(2) > div:first-child');
                    const productName: string = await page.evaluate((el) => el.textContent.trim(), productNameElement);

                    if (!productName.includes('3080')) {
                        resolve();
                        return;
                    }

                    const productModelNumberElement = await item.$(':first-child > a');
                    const productModelNumber = await page.evaluate(
                        (el) => el.textContent.trim(),
                        productModelNumberElement,
                    );

                    const url: string = await page.evaluate((el) => el.href, productModelNumberElement);

                    const productPriceElement = await item.$(':nth-child(5)');
                    const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
                    const productPrice = currency(productPriceString).value;

                    try {
                        const productPage = await browser.newPage();
                        await productPage.goto(url);
                        await productPage.waitForSelector('#product-stock');

                        const storeAvailabilityElement = await productPage.$(
                            '#product-stock tbody tr:nth-child(2) td:nth-child(3)',
                        );
                        const storeAvailability = await productPage.evaluate(
                            (el) => el.textContent.trim(),
                            storeAvailabilityElement,
                        );

                        const supplierAvailabilityElement = await productPage.$(
                            '#product-stock tbody tr:nth-child(4) td:nth-child(3)',
                        );
                        const supplierAvailability = await productPage.evaluate(
                            (el) => el.textContent.trim(),
                            supplierAvailabilityElement,
                        );

                        const stockStoreElement = await productPage.$(
                            '#product-stock tbody tr:nth-child(2) td:nth-child(2)',
                        );
                        const stockStore = parseInt(
                            await productPage.evaluate((el) => el.textContent.trim(), stockStoreElement),
                            10,
                        );

                        const stockSupplierElement = await productPage.$(
                            '#product-stock tbody tr:nth-child(4) td:nth-child(2)',
                        );
                        const stockSupplier = parseInt(
                            await productPage.evaluate((el) => el.textContent.trim(), stockSupplierElement),
                            10,
                        );

                        await productPage.close();

                        cards.push({
                            name: productName,
                            productNumber: productModelNumber,
                            price: productPrice,
                            availability: `${storeAvailability} - ${supplierAvailability}`,
                            url,
                            stockStore,
                            stockSupplier,
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

export default EYO;
