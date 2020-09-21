import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';

class AussieAppliances implements Scannable {
    url =
        'https://www.aussieappliances.com.au/product-category/video-graphics-cards/pci-e-nvidia-chipset/?orderby=date';

    async scan(browser: Browser) {
        const page = await browser.newPage();
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.products');
        const items = await page.$$('.products .product');

        await Promise.allSettled(
            items.map((item) => {
                return new Promise(async (resolve) => {
                    const productNameElement = await item.$('.product-title > a');
                    const productName: string = await page.evaluate((el) => el.textContent.trim(), productNameElement);
                    const url: string = await page.evaluate((el) => el.href, productNameElement);

                    if (!productName.includes('3080')) {
                        resolve();
                        return;
                    }

                    const productModelNumber = url.substr(url.lastIndexOf('/', url.length - 2) + 1);

                    const productPriceElement = await item.$('.price');
                    const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
                    const productPrice = currency(productPriceString).value;

                    try {
                        const productPage = await browser.newPage();
                        await productPage.goto(url);
                        await productPage.waitForSelector('.stock');

                        const availabilityElement = await productPage.$('.stock');
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

export default AussieAppliances;
