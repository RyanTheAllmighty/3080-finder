import config from 'config';
import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';
import logger from '../utils/logger';

class DDComputer implements Scannable {
    url =
        'https://ddcomputer.com.au/index.php?body=searchEngine&type=result&searchText=3080&searchType=normal&title1=Search+Result%203080&searchCat=VIDEO&title1=search%20result%20list%20in%20category%20of%20%20VIDEO&searchThumbnailViewing=off&title1=Search%20result%20list&title2=with%20off%20thumbnail';

    async scan(browser: Browser) {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(config.get<number>('timeout'));
        page.setDefaultTimeout(config.get<number>('timeout'));
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.table');
        const items = await page.$$('.table .row1, .table .row2');

        await Promise.allSettled(
            items.map((item) => {
                return new Promise(async (resolve) => {
                    const productNameElement = await item.$('.parts_title > a');
                    const productName: string = await page.evaluate((el) => el.textContent.trim(), productNameElement);
                    const url: string = await page.evaluate((el) => el.href, productNameElement);

                    if (!productName.includes('3080')) {
                        resolve();
                        return;
                    }

                    const productPriceElement = await item.$('.pricetxt');
                    const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
                    const productPrice = currency(productPriceString).value;

                    try {
                        const productPage = await browser.newPage();
                        productPage.setDefaultNavigationTimeout(config.get<number>('timeout'));
                        productPage.setDefaultTimeout(config.get<number>('timeout'));
                        await productPage.goto(url);
                        await productPage.waitForSelector('.columnContainer');

                        const productModelNumberElement = await productPage.$(
                            '.columnContainer :nth-child(4) .prodInfoRow',
                        );
                        const productModelNumber = await productPage.evaluate(
                            (el) => el.textContent.replace('Product ID:', '').trim(),
                            productModelNumberElement,
                        );

                        const availabilityElement = await productPage.$('.stockInfoContainer > table');
                        const availability = await productPage.evaluate(
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

export default DDComputer;
