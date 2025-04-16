// Required modules
import {MongoClient} from 'mongodb'; // MongoDB operations
import fetch from 'node-fetch'; // HTTP requests
import xml2js from 'xml2js'; // XML parsing

// MongoDB configuration
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'upcdatabase';
const collectionName = 'upcs';

// Define UPC pattern (12 digits)
const upcPattern = /^[0-9]{12}$/;

// Maximum number of products to process
const maxProducts = 1000;
let processedCount = 0;

// Configuration for both sitemaps/sites
const sitemapConfigs = [
  {
    name: 'Allbirds',
    sitemapUrl: 'https://allbirds.ca/sitemap_products_1.xml?from=8668842131776&to=9772112544064',
    jsonBaseUrl: 'https://allbirds.ca/products/', // Append slug.json to get JSON data
    productBaseUrl: 'https://allbirds.ca/products/', // Base URL for constructing product page URL
  },
  {
    name: 'Tentree',
    sitemapUrl: 'https://www.tentree.ca/sitemap_products_1.xml?from=299402821662&to=7193819480250',
    jsonBaseUrl: 'https://www.tentree.ca/products/',
    productBaseUrl: 'https://www.tentree.ca/products/',
  },
];

/**
 * Fetches and parses a sitemap from the given URL.
 * @param {string} sitemapUrl - The URL of the sitemap.
 * @returns {Promise<string[]>} - Array of product URLs.
 */
async function fetchSitemap(sitemapUrl) {
  const response = await fetch(sitemapUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status}`);
  }
  const xml = await response.text();
  const parsed = await xml2js.parseStringPromise(xml);
  // Assumes sitemap structure <urlset><url><loc>...</loc></url></urlset>
  const urls = parsed.urlset.url.map((item) => item.loc[0]);
  return urls;
}

/**
 * Processes a single product by:
 * - Extracting the slug from its URL.
 * - Fetching its JSON data.
 * - Processing only the first variant.
 * - Upserting the record into MongoDB.
 *
 * @param {string} productUrl - The full product URL.
 * @param {Object} config - The site configuration object.
 * @param {Collection} collection - The MongoDB collection.
 */
async function processProduct(productUrl, config, collection) {
  // Extract the slug (assumes it is the last segment in the URL)
  const parts = productUrl.split('/');
  const slug = parts[parts.length - 1] || parts[parts.length - 2];

  // Construct JSON endpoint URL
  const jsonUrl = `${config.jsonBaseUrl}${slug}.json`;

  try {
    const res = await fetch(jsonUrl);
    if (!res.ok) {
      console.error(`Failed to fetch ${jsonUrl}: ${res.status}`);
      return;
    }
    const data = await res.json();
    const product = data.product;
    const title = product.title;
    const bodyHtml = product.body_html;
    // Primary image or fallback to first image if available
    const mainImage = (product.image && product.image.src) || (product.images && product.images[0] && product.images[0].src) || '';
    const productUrlClean = `${config.productBaseUrl}${slug}`;

    // Process only the first variant if available
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      const upc = variant.barcode;
      if (!upc || !upcPattern.test(upc)) return;

      // Construct the document for MongoDB
      const record = {
        _id: upc, // UPC as the document ID
        image: mainImage,
        title: title,
        weight: variant.weight,
        weightUnit: variant.weight_unit,
        retailers: [
          {
            retailer: config.name,
            productUrl: productUrlClean,
            price: parseFloat(variant.price),
            currency: variant.price_currency,
            description: bodyHtml,
            sku: variant.sku,
          },
        ],
      };

      try {
        await collection.updateOne({_id: upc}, {$set: record}, {upsert: true});
        console.log(`Upserted record for UPC: ${upc} (${config.name})`);
      } catch (err) {
        console.error(`Error upserting UPC ${upc}: ${err.message}`);
      }
    }
  } catch (error) {
    console.error(`Error processing product ${jsonUrl}: ${error.message}`);
  }
}

/**
 * Processes all product URLs from a given sitemap.
 *
 * @param {Object} config - The site configuration.
 * @param {Collection} collection - The MongoDB collection.
 */
async function processSitemap(config, collection) {
  try {
    const urls = await fetchSitemap(config.sitemapUrl);
    console.log(`Processing ${urls.length} products from ${config.name}`);
    for (const url of urls) {
      if (processedCount >= maxProducts) {
        console.log(`Reached maximum of ${maxProducts} products. Stopping processing.`);
        return;
      }
      await processProduct(url, config, collection);
      processedCount++;
    }
  } catch (error) {
    console.error(`Error processing sitemap for ${config.name}: ${error.message}`);
  }
}

/**
 * Main function:
 * - Connects to MongoDB.
 * - Processes both sitemaps up to the defined maximum product count.
 * - Closes the database connection.
 */
async function main() {
  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    for (const config of sitemapConfigs) {
      if (processedCount >= maxProducts) break;
      await processSitemap(config, collection);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

// Run the main function
main();
