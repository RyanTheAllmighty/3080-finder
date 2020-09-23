import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';
import logger from '../utils/logger';

class TechHut implements Scannable {
    url = 'https://techhut.com.au/?s=RTX+3080&dgwt-wcas-search-submit=&post_type=product&dgwt_wcas=1';

    async scan(browser: Browser) {
        const page = await browser.newPage();
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.ast-woocommerce-container');
        const items = await page.$$('.ast-woocommerce-container .products > li');

        await Promise.allSettled(
            items.map((item) => {
                return new Promise(async (resolve) => {
                    const productNameElement = await item.$('.astra-shop-summary-wrap > a');
                    const productName: string = await page.evaluate((el) => el.textContent.trim(), productNameElement);
                    const url: string = await page.evaluate((el) => el.href, productNameElement);

                    if (!productName.includes('3080')) {
                        resolve();
                        return;
                    }

                    const productPriceElement = await item.$('.price bdi');
                    const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
                    const productPrice = currency(productPriceString).value;

                    try {
                        const productPage = await browser.newPage();
                        await productPage.goto(url);
                        await productPage.waitForSelector('#main');

                        const productModelNumberElement = await productPage.$('.sku');
                        const productModelNumber = await productPage.evaluate(
                            (el) => el.textContent.trim(),
                            productModelNumberElement,
                        );

                        const availabilityElement = await productPage.$('.stock');
                        const availability: string = await productPage.evaluate(
                            (el) => el.textContent.trim(),
                            availabilityElement,
                        );

                        await productPage.close();

                        cards.push({
                            name: productName,
                            productNumber: productModelNumber,
                            price: productPrice,
                            availability,
                            url,
                            stockStore: availability.includes(' in Stock')
                                ? parseInt(availability.replace(' in Stock', ''), 10)
                                : 0,
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

export default TechHut;
