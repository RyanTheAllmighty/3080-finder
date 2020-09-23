import currency from 'currency.js';
import type { Browser } from 'puppeteer';

import type { Card, Scannable } from '../core';
import { getNewPage } from '../utils/browser';

class FantasticHobbies implements Scannable {
    urls = [
        'https://fantastic-hobbies.com.au/shop/computer-components/video-cards/msi-nvidia-geforce-rtx-3080-ventus-3x-10g-oc-gddr6x-1740-mhz-boost-4-displays-7680x4320-3xdp-1xhdmi-vr-ready/',
        'https://fantastic-hobbies.com.au/shop/computer-components/video-cards/msi-nvidia-geforce-rtx-3080-gaming-x-trio-10g-gddr6x-1815-mhz-boost-4-displays-7680x4320-3xdp-1xhdmi-vr-ready/',
        'https://fantastic-hobbies.com.au/shop/computer-components/video-cards/gigabyte-nvidia-geforce-rtx-3080-eagle-oc-10g-atx-gddr6x-1755mhz-1710-mhz-3xdp-2xhdmi-windforce-3x-rgb-2-0/',
        'https://fantastic-hobbies.com.au/shop/computer-components/video-cards/gigabyte-nvidia-geforce-rtx-3080-gaming-oc-10g-atx-gddr6x-1800mhz-1710-mhz-pcie4-0x16-3xdp-2xhdmi/',
    ];

    async scan(browser: Browser) {
        const cards: Card[] = [];

        await Promise.allSettled(
            this.urls.map((pageUrl) => {
                return new Promise(async (resolve) => {
                    const page = await getNewPage(browser);
                    await page.goto(pageUrl);

                    const productNameElement = await page.$('.product_title');
                    const productName: string = await page.evaluate((el) => el.textContent.trim(), productNameElement);

                    const productModelNumberElement = await page.$('.sku');
                    const productModelNumber = await page.evaluate(
                        (el) => el.textContent.trim(),
                        productModelNumberElement,
                    );

                    const productPriceElement = await page.$('.price > ins > .amount, .price > .amount');
                    const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
                    const productPrice = currency(productPriceString).value;

                    const availabilityElement = await page.$('.stock');
                    const availability = await page.evaluate((el) => el.textContent.trim(), availabilityElement);

                    cards.push({
                        name: productName,
                        productNumber: productModelNumber,
                        price: productPrice,
                        availability,
                        url: pageUrl,
                    });

                    resolve();
                });
            }),
        );

        return {
            cards,
        };
    }
}

export default FantasticHobbies;
