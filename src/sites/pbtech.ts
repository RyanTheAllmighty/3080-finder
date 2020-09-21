import puppeteer from 'puppeteer';
import currency from 'currency.js';

import type { Card, Scannable } from '../core';

class PBTech implements Scannable {
    url = 'https://www.pbtech.com/au/category/components/video-cards/nvidia-desktop-graphics-cards/geforce-rtx-3080';

    async scan() {
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--window-size=1920,1080', '--window-position=1921,0'],
        });
        const page = await browser.newPage();
        await page.goto(this.url);

        const cards: Card[] = [];

        await page.waitForSelector('.products_list_wrapper');
        const items = await page.$$('.products_list_wrapper .item');

        for await (const item of items) {
            const productNameElement = await item.$('.item_line_name');
            const productName = await page.evaluate((el) => el.textContent.trim(), productNameElement);
            const url = await page.evaluate((el) => el.href, productNameElement);

            const productModelNumberElement = await item.$('.item_attribute:nth-child(2) > .attr_value');
            const productModelNumber = await page.evaluate((el) => el.textContent.trim(), productModelNumberElement);

            const productPriceElement = await item.$('.ginc .price_full');
            const productPriceString = await page.evaluate((el) => el.textContent.trim(), productPriceElement);
            const productPrice = currency(productPriceString).value;

            const shippingDateElement = await item.$('.pPickUp');
            const shippingDate = await page.evaluate((el) => el.textContent.trim(), shippingDateElement);

            const stockStoreElement = await item.$('.stock_pb .stock_display');
            const stockStore = parseInt(await page.evaluate((el) => el.textContent.trim(), stockStoreElement), 10);

            const stockSupplierElement = await item.$('.stock_other .stock_display');
            const stockSupplier = parseInt(
                await page.evaluate((el) => el.textContent.trim(), stockSupplierElement),
                10,
            );

            cards.push({
                name: productName,
                productNumber: productModelNumber,
                price: productPrice,
                availability: shippingDate,
                url,
                stockStore,
                stockSupplier,
            });
        }

        await browser.close();

        return {
            cards,
        };
    }
}

export default PBTech;
