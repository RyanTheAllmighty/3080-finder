import config from 'config';

import type { Browser, Page } from 'puppeteer';

export const getNewPage = async (browser: Browser): Promise<Page> => {
    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(config.get<number>('timeout'));
    page.setDefaultTimeout(config.get<number>('timeout'));

    await page.setRequestInterception(true);

    page.on('request', (req) => {
        if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
            req.abort();
        } else {
            req.continue();
        }
    });

    return page;
};
