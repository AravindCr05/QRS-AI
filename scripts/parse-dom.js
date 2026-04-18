const fs = require('fs');
const cheerio = require('cheerio');

function inspectDOM(filename) {
    if (!fs.existsSync(filename)) return;
    const html = fs.readFileSync(filename, 'utf-8');
    const $ = cheerio.load(html);
    
    console.log(`\n--- Inspecting ${filename} ---`);
    console.log("Inputs:");
    $('input').each((i, el) => {
        const id = $(el).attr('id');
        const placeholder = $(el).attr('placeholder');
        const formControlName = $(el).attr('formcontrolname');
        console.log(`  - id: ${id}, placeholder: ${placeholder}, formcontrolname: ${formControlName}`);
    });
    
    console.log("\nTable Headers:");
    $('th').each((i, el) => {
        console.log(`  - ${$(el).text().trim()}`);
    });
    
    console.log("\nTabs/Buttons:");
    $('.nav-link, button').each((i, el) => {
        console.log(`  - type: ${el.tagName.toLowerCase()}, text: ${$(el).text().trim()}, role: ${$(el).attr('role')}`);
    });
}

inspectDOM('file-processing-dom.html');
inspectDOM('qr-transaction-dom.html');
