import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import db from './db.js';

// Configure Puppeteer with stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

const __dirname = dirname(fileURLToPath(import.meta.url));

class AIService {
  constructor() {
    this.materials = null;
    this.rules = null;
    this.applications = null;
    this.openai = null;
    this.initializeOpenAI();
  }

  initializeOpenAI() {
    // Re-check environment variable each time (in case it was added after module load)
    if (process.env.OPENAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        console.log('OpenAI initialized successfully');
      } catch (error) {
        console.error('Error initializing OpenAI:', error);
        this.openai = null;
      }
    } else {
      console.log('OpenAI API key not found in environment variables');
      this.openai = null;
    }
  }

  async loadMaterialLibrary() {
    if (this.materials && this.rules) return;

    const filePath = join(__dirname, '..', 'data', 'materials.json');
    const data = JSON.parse(await readFile(filePath, 'utf-8'));
    
    this.materials = data.materials;
    this.rules = data.rules;
    this.applications = data.applications;
  }

  parseQuery(query) {
    const queryLower = query.toLowerCase();
    const parsed = {
      originalQuery: query,
      detectedMaterial: null,
      detectedApplication: null,
      detectedTemperature: null,
      keywords: []
    };

    // Detect temperature (e.g., "1500F", "1500°F", "1500 degrees")
    const tempMatch = queryLower.match(/(\d{3,4})\s*(?:°?f|degrees?\s*f)/i);
    if (tempMatch) {
      parsed.detectedTemperature = parseInt(tempMatch[1]);
    }

    // Detect materials
    const materialMappings = {
      '321': '321_stainless',
      '321 stainless': '321_stainless',
      '321 ss': '321_stainless',
      '304': '304_stainless',
      '304 stainless': '304_stainless',
      '316': '316_stainless',
      '316 stainless': '316_stainless',
      'inconel 600': 'inconel_600',
      'inconel600': 'inconel_600',
      'inconel 625': 'inconel_625',
      '309': '309_stainless',
      '309 stainless': '309_stainless',
      'hastelloy': 'hastelloy_x',
      'aluminum': 'aluminum_6061',
      '6061': 'aluminum_6061',
      'titanium': 'titanium_gr2'
    };

    for (const [pattern, material] of Object.entries(materialMappings)) {
      if (queryLower.includes(pattern)) {
        parsed.detectedMaterial = material;
        break;
      }
    }

    // Detect application
    for (const [appType, keywords] of Object.entries(this.applications || {})) {
      for (const keyword of keywords) {
        if (queryLower.includes(keyword)) {
          parsed.detectedApplication = appType;
          parsed.keywords.push(keyword);
          break;
        }
      }
      if (parsed.detectedApplication) break;
    }

    // Extract other keywords
    const importantWords = queryLower
      .split(/\s+/)
      .filter(w => w.length > 3 && !['with', 'from', 'that', 'this', 'have'].includes(w));
    parsed.keywords = [...new Set([...parsed.keywords, ...importantWords])];

    return parsed;
  }

  async getRecommendation(query) {
    await this.loadMaterialLibrary();

    const parsed = this.parseQuery(query);
    
    // Check each rule
    for (const rule of this.rules) {
      const trigger = rule.trigger;
      let matches = true;

      // Check material match
      if (trigger.materials && parsed.detectedMaterial) {
        if (!trigger.materials.includes(parsed.detectedMaterial)) {
          matches = false;
        }
      }

      // Check application match
      if (trigger.applications && matches) {
        const appMatch = trigger.applications.some(app => 
          parsed.keywords.some(kw => app.includes(kw) || kw.includes(app))
        );
        if (!appMatch && parsed.detectedApplication) {
          // Check if detected application maps to trigger applications
          const appKeywords = this.applications[parsed.detectedApplication] || [];
          const appOverlap = trigger.applications.some(triggerApp =>
            appKeywords.some(kw => triggerApp.includes(kw))
          );
          if (!appOverlap) matches = false;
        }
      }

      // Check temperature
      if (trigger.tempMin && matches) {
        if (!parsed.detectedTemperature || parsed.detectedTemperature < trigger.tempMin) {
          // Only fail if we have temperature and it's too low
          if (parsed.detectedTemperature && parsed.detectedTemperature < trigger.tempMin) {
            matches = false;
          }
        }
      }

      if (matches && parsed.detectedMaterial && trigger.materials?.includes(parsed.detectedMaterial)) {
        // Found a matching rule
        const currentMaterial = this.materials[parsed.detectedMaterial];
        const recommendedMaterial = this.materials[rule.recommendation];

        // Find recommended suppliers in marketplace
        await db.read();
        const suppliers = db.data.dpps.filter(dpp => {
          const material = dpp.specs?.material?.toLowerCase() || '';
          return material.includes(recommendedMaterial.name.toLowerCase().split(' ')[0]) ||
                 dpp.name?.toLowerCase().includes(rule.recommendation.replace('_', ' '));
        }).slice(0, 3);

        return {
          hasRecommendation: true,
          severity: rule.severity,
          query: parsed,
          currentMaterial: {
            id: parsed.detectedMaterial,
            ...currentMaterial,
            operatingTemp: parsed.detectedTemperature,
            safetyMargin: currentMaterial.maxTemp - (parsed.detectedTemperature || currentMaterial.maxTemp)
          },
          recommendedMaterial: {
            id: rule.recommendation,
            ...recommendedMaterial,
            tempMargin: recommendedMaterial.maxTemp - (parsed.detectedTemperature || 0)
          },
          reasoning: rule.reasoning,
          tcoAnalysis: rule.tcoAnalysis,
          recommendedSuppliers: suppliers.length > 0 ? suppliers : [{
            id: 'demo',
            name: 'Grand River Alloys',
            seller: { name: 'Grand River Alloys', location: 'Cambridge, ON' },
            availability: { status: 'in_stock', leadTimeDays: 3 },
            nafta: { qualifies: true }
          }],
          application: parsed.detectedApplication
        };
      }
    }

    // No recommendation found
    return {
      hasRecommendation: false,
      query: parsed,
      message: 'No specific recommendations for this search. The selected material appears suitable for the application.'
    };
  }

  formatTCOComparison(tco) {
    if (!tco) return null;

    return {
      current: {
        initialCost: `$${tco.currentMaterial.initialCost.toLocaleString()}`,
        serviceLife: `${tco.currentMaterial.serviceLifeYears} years`,
        replacements: tco.currentMaterial.replacementsIn10Years,
        totalTCO: `$${tco.currentMaterial.totalTCO10Year.toLocaleString()}`
      },
      recommended: {
        initialCost: `$${tco.recommendedMaterial.initialCost.toLocaleString()}`,
        serviceLife: `${tco.recommendedMaterial.serviceLifeYears} years`,
        replacements: tco.recommendedMaterial.replacementsIn10Years,
        totalTCO: `$${tco.recommendedMaterial.totalTCO10Year.toLocaleString()}`
      },
      savings: `$${tco.savings10Year.toLocaleString()}`,
      savingsPercentage: Math.round((tco.savings10Year / tco.currentMaterial.totalTCO10Year) * 100)
    };
  }

  /**
   * Extract text content and image URLs from a website URL
   */
  async fetchWebsiteContent(url) {
    let browser = null;
    try {
      console.log(`Fetching content from URL using Puppeteer: ${url}`);
      const urlObj = new URL(url);
      
      // Check if we should skip Puppeteer and use fallback directly (for sites that block cloud IPs)
      const useFallbackOnly = process.env.USE_FETCH_FALLBACK_ONLY === 'true' || 
                             process.env.FORCE_FETCH_FALLBACK === 'true';
      
      if (useFallbackOnly) {
        console.log(`Skipping Puppeteer, using fallback fetch only (env var set)`);
        return await this.fetchWebsiteContentFallback(url);
      }
      
      // Launch browser with stealth plugin
      try {
        console.log(`Launching Puppeteer browser...`);
        
        // Configure Puppeteer cache directory for Render if needed
        if (process.env.RENDER && !process.env.PUPPETEER_CACHE_DIR) {
          // On Render, use a writable directory
          process.env.PUPPETEER_CACHE_DIR = '/tmp/.cache/puppeteer';
        }
        
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--single-process' // Helps on some cloud platforms
          ],
          timeout: 60000 // 60 second timeout for browser launch (increased for slower systems)
        });
        console.log(`Puppeteer browser launched successfully`);
      } catch (launchError) {
        console.error(`Failed to launch Puppeteer browser:`, launchError.message || launchError);
        console.error(`Launch error stack:`, launchError.stack);
        // Fallback to regular fetch if Puppeteer fails
        console.log(`Falling back to regular fetch for ${url}`);
        return await this.fetchWebsiteContentFallback(url);
      }
      
      if (!browser) {
        console.log(`Browser not launched, using fallback fetch for ${url}`);
        return await this.fetchWebsiteContentFallback(url);
      }
      
      const page = await browser.newPage();
      
      // Set realistic viewport
      await page.setViewport({ 
        width: 1920, 
        height: 1080,
        deviceScaleFactor: 1
      });
      
      // Enhanced stealth: Remove webdriver property and other automation indicators
      await page.evaluateOnNewDocument(() => {
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
        
        // Override permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
        
        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // Mock languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
        
        // Override chrome property
        window.chrome = {
          runtime: {},
        };
      });
      
      // Use more recent Chrome user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
      
      // Set additional headers with referrer for better authenticity
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1',
        'Referer': `${urlObj.protocol}//${urlObj.host}/`
      });
      
      // Navigate with timeout - use 'domcontentloaded' for faster, more reliable loading
      console.log(`Navigating to ${url}...`);
      
      // Small delay to mimic human behavior (helps avoid detection)
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      
      let response = null;
      try {
        response = await page.goto(url, { 
          waitUntil: 'domcontentloaded', // Changed from 'networkidle2' for better reliability
          timeout: 45000 // 45 second timeout (reduced from 60s for faster failure detection)
        });
      } catch (navError) {
        // If navigation fails, try with a shorter timeout
        console.log(`Navigation with domcontentloaded failed, trying load event...`);
        try {
          response = await page.goto(url, { 
            waitUntil: 'load', 
            timeout: 30000 // 30 second timeout (reduced from 40s)
          });
        } catch (loadError) {
          // If both fail, try with commit (fastest option)
          console.log(`Navigation with load failed, trying commit event...`);
          response = await page.goto(url, { 
            waitUntil: 'commit', 
            timeout: 20000 // 20 second timeout
          });
        }
      }
      
      // Check response status for 403/404 errors
      if (response) {
        const status = response.status();
        console.log(`Page navigation response status: ${status}`);
        
        if (status === 403) {
          console.log(`403 detected from Puppeteer, closing browser and trying fallback...`);
          await browser.close();
          browser = null;
          // Instead of throwing, return null to trigger fallback in calling code
          throw new Error(`Access forbidden (403). The website (${urlObj.host}) may be blocking automated requests. Trying fallback method...`);
        }
        if (status === 404) {
          await browser.close();
          browser = null;
          throw new Error(`Page not found (404). The URL may be invalid or the page may have been removed.`);
        }
        if (status >= 500) {
          await browser.close();
          browser = null;
          throw new Error(`Server error (${status}). The website may be temporarily unavailable.`);
        }
      }
      
      // Wait for JavaScript to execute and images to load
      // For Amazon and similar sites, images are often lazy-loaded
      console.log(`Waiting for page to fully load...`);
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000)); // 1.5-2.5 seconds (reduced from 3-5)
      
      // For Amazon specifically, wait for product images to load (optimized for speed)
      if (url.includes('amazon.com')) {
        try {
          // Use Promise.race to enforce a maximum timeout for Amazon-specific operations
          const amazonTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Amazon image wait timeout')), 8000); // Max 8 seconds total
          });
          
          const amazonImageWait = (async () => {
            // Scroll to trigger lazy loading
            await page.evaluate(() => {
              window.scrollTo(0, document.body.scrollHeight / 2);
            });
            await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms
            
            // Try only the most common selectors first (reduced from 7 to 4)
            const selectors = [
              '#landingImage',
              'img[data-a-image-name]',
              '#main-image-container img',
              'img[src*="media-amazon.com"]'
            ];
            
            let found = false;
            for (const selector of selectors) {
              try {
                // Reduced timeout from 5000ms to 1500ms per selector
                await page.waitForSelector(selector, { timeout: 1500 });
                console.log(`Found Amazon images with selector: ${selector}`);
                found = true;
                break;
              } catch (e) {
                // Try next selector quickly
                continue;
              }
            }
            
            if (!found) {
              console.log('Amazon image containers not found with standard selectors, trying quick check...');
              // Reduced timeout from 10000ms to 3000ms
              await page.waitForFunction(() => {
                return document.querySelectorAll('img[src*="media-amazon.com"]').length > 0;
              }, { timeout: 3000 }).catch(() => {
                console.log('No Amazon media images found, continuing...');
              });
            }
            
            // Reduced wait from 2000ms to 500ms
            await new Promise(resolve => setTimeout(resolve, 500));
          })();
          
          // Race between Amazon wait and timeout
          await Promise.race([amazonImageWait, amazonTimeout]).catch(() => {
            console.log('Amazon image wait exceeded timeout, continuing with available content...');
          });
        } catch (e) {
          console.log('Could not wait for Amazon images, continuing...', e.message);
        }
      }
      
      // Extract images from the rendered DOM (not just HTML source)
      // This captures images loaded by JavaScript
      const renderedImageUrls = await page.evaluate(() => {
        const images = [];
        const seen = new Set();
        
        // For Amazon, prioritize product image containers
        const amazonSelectors = [
          '#landingImage',
          '#main-image-container img',
          '.a-dynamic-image',
          '[data-a-image-name]',
          '#imageBlock_feature_div img',
          '#altImages img',
          '.a-button-selected img'
        ];
        
        // Get Amazon product images first (if on Amazon)
        if (window.location.hostname.includes('amazon')) {
          for (const selector of amazonSelectors) {
            document.querySelectorAll(selector).forEach(img => {
              const sources = [
                img.src,
                img.getAttribute('data-src'),
                img.getAttribute('data-a-dynamic-image'),
                img.getAttribute('data-old-src'),
                img.currentSrc
              ];
              
              for (const src of sources) {
                if (src && src.startsWith('http') && !seen.has(src)) {
                  const srcLower = src.toLowerCase();
                  // Amazon product images are typically from m.media-amazon.com
                  if (srcLower.includes('media-amazon.com') && 
                      srcLower.match(/\.(jpg|jpeg|png|gif|webp)/) &&
                      !srcLower.includes('placeholder') &&
                      !srcLower.includes('spinner')) {
                    images.push(src);
                    seen.add(src);
                  }
                }
              }
            });
          }
        }
        
        // Get all other img elements
        document.querySelectorAll('img').forEach(img => {
          // Skip if already processed (for Amazon)
          if (window.location.hostname.includes('amazon') && 
              (img.closest('#imageBlock_feature_div') || 
               img.closest('#altImages') ||
               img.hasAttribute('data-a-image-name'))) {
            return; // Already processed above
          }
          
          // Try multiple sources in order of preference
          const sources = [
            img.src,                    // Current src
            img.getAttribute('data-src'), // Lazy loading
            img.getAttribute('data-lazy'), // Another lazy loading pattern
            img.getAttribute('data-original'), // Original image
            img.getAttribute('data-a-dynamic-image'), // Amazon specific
            img.currentSrc              // Current source (for srcset)
          ];
          
          for (const src of sources) {
            if (src && src.startsWith('http') && !seen.has(src)) {
              // Filter out placeholder and non-product images
              const srcLower = src.toLowerCase();
              if (!srcLower.includes('placeholder') && 
                  !srcLower.includes('spinner') && 
                  !srcLower.includes('loading') &&
                  !srcLower.includes('1x1') &&
                  !srcLower.includes('pixel') &&
                  !srcLower.includes('logo') &&
                  !srcLower.includes('icon') &&
                  srcLower.match(/\.(jpg|jpeg|png|gif|webp)/)) {
                images.push(src);
                seen.add(src);
              }
            }
          }
        });
        
        return images;
      });
      
      console.log(`Found ${renderedImageUrls.length} images from rendered DOM`);
      
      // Get page content
      const html = await page.content();
      console.log(`Successfully fetched ${html.length} characters from ${url}`);
      
      // Get text content
      const textContent = await page.evaluate(() => {
        return document.body.innerText || '';
      });

      // Build a compact, product-focused payload for Amazon pages to avoid sending massive page text.
      let amazonFocusedText = '';
      if (url.includes('amazon.com')) {
        amazonFocusedText = await page.evaluate(() => {
          const readText = (selector) => {
            const el = document.querySelector(selector);
            return el ? el.textContent.trim() : '';
          };
          const readList = (selector) =>
            Array.from(document.querySelectorAll(selector))
              .map(el => el.textContent.replace(/\s+/g, ' ').trim())
              .filter(Boolean);

          const title = readText('#productTitle');
          const brand = readText('#bylineInfo');
          const price =
            readText('.a-price .a-offscreen') ||
            readText('#corePriceDisplay_desktop_feature_div .a-offscreen') ||
            readText('#priceblock_ourprice') ||
            readText('#priceblock_dealprice');
          const bullets = readList('#feature-bullets li span.a-list-item').slice(0, 15);
          const detailsRows = Array.from(
            document.querySelectorAll(
              '#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr'
            )
          )
            .map(row => {
              const cells = row.querySelectorAll('th, td');
              if (cells.length < 2) return '';
              const key = cells[0].textContent.replace(/\s+/g, ' ').trim();
              const value = cells[1].textContent.replace(/\s+/g, ' ').trim();
              return key && value ? `${key}: ${value}` : '';
            })
            .filter(Boolean)
            .slice(0, 30);
          const detailBullets = readList('#detailBullets_feature_div li').slice(0, 30);

          const sections = [];
          if (title) sections.push(`Title: ${title}`);
          if (brand) sections.push(`Brand: ${brand}`);
          if (price) sections.push(`Price: ${price}`);
          if (bullets.length) sections.push(`Features:\n- ${bullets.join('\n- ')}`);
          if (detailsRows.length) sections.push(`Technical Details:\n- ${detailsRows.join('\n- ')}`);
          if (detailBullets.length) sections.push(`Additional Details:\n- ${detailBullets.join('\n- ')}`);
          return sections.join('\n\n');
        });
      }
      
      // Close browser
      await browser.close();
      browser = null;
      
      const baseUrl = new URL(url);
      
      // Extract image URLs from both HTML source and rendered DOM
      const htmlImageUrls = this.extractImageUrls(html, baseUrl);
      console.log(`Extracted ${htmlImageUrls.length} image URLs from HTML source`);
      
      // Combine and deduplicate
      const allImageUrls = [...new Set([...htmlImageUrls, ...renderedImageUrls])];
      console.log(`Total unique image URLs: ${allImageUrls.length}`);
      
      // Better HTML parsing - preserve structure and important data
      // Remove scripts and styles
      let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
      
      // Preserve important structured data from common HTML patterns
      // Extract data attributes and structured data
      const dataMatches = html.match(/data-[^=]+="[^"]*"/gi) || [];
      const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
      
      // Prefer compact Amazon-specific extraction to keep prompt size low.
      if (amazonFocusedText && amazonFocusedText.trim().length > 0) {
        text = amazonFocusedText.trim();
      } else if (textContent && textContent.trim().length > 0) {
        text = textContent.trim();
      } else {
        // Fallback to HTML parsing
        text = text
          .replace(/<h[1-6][^>]*>/gi, '\n### ')
          .replace(/<\/h[1-6]>/gi, '\n')
          .replace(/<p[^>]*>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<div[^>]*>/gi, '\n')
          .replace(/<\/div>/gi, '\n')
          .replace(/<li[^>]*>/gi, '\n- ')
          .replace(/<\/li>/gi, '\n')
          .replace(/<td[^>]*>/gi, ' | ')
          .replace(/<\/td>/gi, '')
          .replace(/<th[^>]*>/gi, ' | ')
          .replace(/<\/th>/gi, '')
          .replace(/<tr[^>]*>/gi, '\n')
          .replace(/<\/tr>/gi, '\n')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      // Add structured data if found
      if (jsonLdMatches.length > 0) {
        text = '\n=== STRUCTURED DATA ===\n' + jsonLdMatches.join('\n') + '\n\n=== PAGE CONTENT ===\n' + text;
      }
      
      // Add image URLs to the content for AI extraction
      if (allImageUrls.length > 0) {
        text += '\n\n=== IMAGE URLs ===\n' + allImageUrls.join('\n');
      }
      
      // Keep payload compact so downstream AI extraction remains fast and reliable.
      const maxReturnedChars = parseInt(process.env.AI_FETCH_MAX_TEXT_CHARS || '50000', 10);
      return {
        text: text.substring(0, maxReturnedChars),
        imageUrls: allImageUrls
      };
    } catch (error) {
      // Ensure browser is closed even on error
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
      
      // Handle timeout specifically
      if (error.name === 'TimeoutError' || error.message.includes('timeout') || error.message.includes('Navigation timeout')) {
        console.error(`Timeout fetching URL ${url} (exceeded timeout limit)`);
        throw new Error(`Request timeout. The website took too long to respond (${new URL(url).host}). Please try again or use a different URL.`);
      }
      
      // Handle network errors
      if (error.message.includes('net::ERR_') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error(`Network error fetching URL ${url}:`, error.message);
        throw new Error(`Network error. Could not connect to the website. Please check the URL and try again.`);
      }
      
      // Handle page errors (404, 403, etc.)
      if (error.message.includes('404') || error.message.includes('not found')) {
        throw new Error(`Page not found (404). The URL may be invalid or the page may have been removed.`);
      }
      
      // For 403 errors, automatically try fallback before giving up
      if (error.message.includes('403') || error.message.includes('forbidden')) {
        console.log(`403 error from Puppeteer, automatically trying fallback fetch for ${url}...`);
        try {
          const fallbackResult = await this.fetchWebsiteContentFallback(url);
          console.log(`Fallback fetch succeeded for ${url}`);
          return fallbackResult;
        } catch (fallbackError) {
          console.error(`Fallback fetch also failed for ${url}:`, fallbackError.message);
          // If fallback also gets 403, it's likely IP blocking
          if (fallbackError.message.includes('403') || fallbackError.message.includes('forbidden')) {
            throw new Error(`Access forbidden (403). The website (${new URL(url).host}) is blocking requests from this server. This may be due to IP-based blocking on cloud hosting platforms. Consider using a proxy service or manual data entry.`);
          }
          throw fallbackError;
        }
      }
      
      console.error(`Error fetching URL ${url}:`, error);
      console.error(`Error details:`, {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 500)
      });
      
      // If Puppeteer fails for other reasons, try fallback to regular fetch
      console.log(`Puppeteer failed, trying fallback fetch for ${url}`);
      try {
        return await this.fetchWebsiteContentFallback(url);
      } catch (fallbackError) {
        console.error(`Fallback also failed:`, fallbackError.message);
        // If fallback also fails, throw the original error
        throw error;
      }
    }
  }

  /**
   * Fallback method using regular fetch if Puppeteer fails
   * This method uses Node's native fetch which may have different IP/fingerprint
   */
  async fetchWebsiteContentFallback(url) {
    try {
      const urlObj = new URL(url);
      console.log(`Using fallback fetch method for: ${url}`);
      console.log(`Fallback method uses native fetch API (different from Puppeteer)`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Browser-like headers with updated user agent
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': `${urlObj.protocol}//${urlObj.host}/`,
          'Origin': `${urlObj.protocol}//${urlObj.host}`,
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
          'DNT': '1',
          'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"'
        },
        signal: controller.signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Fallback fetch response status: ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          console.error(`Fallback fetch got 403 from ${urlObj.host} - likely IP-based blocking`);
          throw new Error(`Access forbidden (403). The website (${urlObj.host}) is blocking requests from this server. This may be due to IP-based blocking on cloud hosting platforms.`);
        } else if (response.status === 404) {
          throw new Error(`Page not found (404). The URL may be invalid or the page may have been removed.`);
        } else if (response.status === 429) {
          throw new Error(`Too many requests (429). Please wait a moment and try again.`);
        } else {
          throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
        }
      }
      
      console.log(`Fallback fetch succeeded, reading response body...`);

      // Timeout for reading response body
      const readTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout reading response')), 20000);
      });
      
      let html;
      try {
        html = await Promise.race([response.text(), readTimeout]);
      } catch (readError) {
        if (readError.message === 'Timeout reading response') {
          throw new Error(`Timeout reading response from ${urlObj.host}. The page may be too large or the connection is slow.`);
        }
        throw readError;
      }
      
      console.log(`Successfully read ${html.length} characters from ${url} (fallback)`);
      
      const baseUrl = new URL(url);
      const imageUrls = this.extractImageUrls(html, baseUrl);
      console.log(`Extracted ${imageUrls.length} image URLs from ${url} (fallback)`);
      
      // Parse HTML to text
      let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
      
      const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
      
      text = text
        .replace(/<h[1-6][^>]*>/gi, '\n### ')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<p[^>]*>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<li[^>]*>/gi, '\n- ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<td[^>]*>/gi, ' | ')
        .replace(/<\/td>/gi, '')
        .replace(/<th[^>]*>/gi, ' | ')
        .replace(/<\/th>/gi, '')
        .replace(/<tr[^>]*>/gi, '\n')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (jsonLdMatches.length > 0) {
        text = '\n=== STRUCTURED DATA ===\n' + jsonLdMatches.join('\n') + '\n\n=== PAGE CONTENT ===\n' + text;
      }
      
      if (imageUrls.length > 0) {
        text += '\n\n=== IMAGE URLs ===\n' + imageUrls.join('\n');
      }
      
      return {
        text: text.substring(0, 150000),
        imageUrls: imageUrls
      };
    } catch (error) {
      console.error(`Fallback fetch also failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Extract image URLs from HTML content
   */
  extractImageUrls(html, baseUrl) {
    const imageUrls = new Set();
    const imageContexts = new Map(); // Store context for each image
    const priorityImages = new Set(); // Images from structured data (higher priority)
    
    // FIRST: Extract from JSON-LD structured data (most reliable for products)
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const jsonLd of jsonLdMatches) {
      try {
        const jsonContent = jsonLd.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        const data = JSON.parse(jsonContent);
        this.extractImagesFromJsonLd(data, baseUrl, priorityImages);
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
    
    // Extract from Open Graph and Twitter Card meta tags (also reliable)
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      const imgUrl = this.resolveImageUrl(ogImageMatch[1], baseUrl);
      if (imgUrl && this.isValidImageUrl(imgUrl)) {
        priorityImages.add(imgUrl);
      }
    }
    
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    if (twitterImageMatch && twitterImageMatch[1]) {
      const imgUrl = this.resolveImageUrl(twitterImageMatch[1], baseUrl);
      if (imgUrl && this.isValidImageUrl(imgUrl)) {
        priorityImages.add(imgUrl);
      }
    }
    
    // Add priority images to main set with high score
    priorityImages.forEach(url => {
      imageUrls.add(url);
      imageContexts.set(url, {
        isInProductContainer: true,
        hasProductAlt: true,
        hasProductClass: true,
        isInNonProductContainer: false,
        isFromStructuredData: true
      });
    });
    
    // Extract from <img> tags with context (but exclude those in script tags)
    // First, remove script tags content to avoid extracting images from dynamic injection
    const htmlWithoutScripts = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    const imgMatches = htmlWithoutScripts.match(/<img[^>]+>/gi) || [];
    for (const imgTag of imgMatches) {
      // Get surrounding context (parent element classes, IDs, etc.)
      const contextMatch = html.match(new RegExp(`[^>]*${imgTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*`, 'i'));
      const context = contextMatch ? contextMatch[0] : '';
      const contextLower = context.toLowerCase();
      
      // Check if image is in a product-related container
      const productContainerPatterns = [
        'product', 'item', 'goods', 'catalog', 'gallery', 'listing',
        'detail', 'view', 'image', 'photo', 'picture', 'main-image',
        'product-image', 'product-img', 'item-image', 'thumbnail'
      ];
      const isInProductContainer = productContainerPatterns.some(pattern => 
        contextLower.includes(`class="${pattern}`) || 
        contextLower.includes(`class='${pattern}`) ||
        contextLower.includes(`id="${pattern}`) ||
        contextLower.includes(`id='${pattern}`)
      );
      
      // Check if image has product-related attributes
      const hasProductAlt = imgTag.match(/alt=["']([^"']*product[^"']*|item[^"']*|goods[^"']*)/i);
      const hasProductClass = imgTag.match(/class=["']([^"']*product[^"']*|item[^"']*|goods[^"']*)/i);
      
      // Skip if clearly not a product image (in navigation, header, footer, etc.)
      const nonProductContainers = ['nav', 'header', 'footer', 'menu', 'sidebar', 'widget', 'social', 'share'];
      const isInNonProductContainer = nonProductContainers.some(pattern => 
        contextLower.includes(`class="${pattern}`) || 
        contextLower.includes(`id="${pattern}`)
      );
      
      // Try src attribute
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        const imgUrl = this.resolveImageUrl(srcMatch[1], baseUrl);
        if (imgUrl && this.isValidImageUrl(imgUrl)) {
          // Only add if it's likely a product image
          if (isInProductContainer || hasProductAlt || hasProductClass || (!isInNonProductContainer && !this.isLikelyNonProductImage(imgUrl))) {
            imageUrls.add(imgUrl);
            imageContexts.set(imgUrl, {
              isInProductContainer,
              hasProductAlt: !!hasProductAlt,
              hasProductClass: !!hasProductClass,
              isInNonProductContainer
            });
          }
        }
      }
      
      // Try data-src (lazy loading)
      const dataSrcMatch = imgTag.match(/data-src=["']([^"']+)["']/i);
      if (dataSrcMatch && dataSrcMatch[1]) {
        const imgUrl = this.resolveImageUrl(dataSrcMatch[1], baseUrl);
        if (imgUrl && this.isValidImageUrl(imgUrl)) {
          if (isInProductContainer || hasProductAlt || hasProductClass || (!isInNonProductContainer && !this.isLikelyNonProductImage(imgUrl))) {
            imageUrls.add(imgUrl);
            imageContexts.set(imgUrl, {
              isInProductContainer,
              hasProductAlt: !!hasProductAlt,
              hasProductClass: !!hasProductClass,
              isInNonProductContainer
            });
          }
        }
      }
      
      // Try srcset
      const srcsetMatch = imgTag.match(/srcset=["']([^"']+)["']/i);
      if (srcsetMatch && srcsetMatch[1]) {
        const srcsetUrls = srcsetMatch[1].split(',').map(s => s.trim().split(/\s+/)[0]);
        for (const srcsetUrl of srcsetUrls) {
          const imgUrl = this.resolveImageUrl(srcsetUrl, baseUrl);
          if (imgUrl && this.isValidImageUrl(imgUrl)) {
            if (isInProductContainer || hasProductAlt || hasProductClass || (!isInNonProductContainer && !this.isLikelyNonProductImage(imgUrl))) {
              imageUrls.add(imgUrl);
              imageContexts.set(imgUrl, {
                isInProductContainer,
                hasProductAlt: !!hasProductAlt,
                hasProductClass: !!hasProductClass,
                isInNonProductContainer
              });
            }
          }
        }
      }
    }
    
    
    // Filter out common non-product images (logos, icons, etc.)
    // Prioritize images with product context
    const filteredUrls = Array.from(imageUrls)
      .map(url => ({
        url,
        context: imageContexts.get(url) || {},
        score: this.calculateProductImageScore(url, imageContexts.get(url))
      }))
      .filter(item => {
        const urlLower = item.url.toLowerCase();
        
        // Exclude if clearly non-product based on URL
        if (this.isLikelyNonProductImage(item.url)) {
          return false;
        }
        
        // Exclude common non-product image paths
        const excludePatterns = [
          '/logo', '/icon', '/favicon', '/sprite', '/button', '/arrow',
          '/social', '/share', '/badge', '/banner', '/header', '/footer',
          '/avatar', '/profile', '/placeholder', '/loading', '/spinner',
          '/nav', '/navigation', '/menu', '/search', '/cart', '/checkout',
          '/account', '/user', '/sign', '/login', '/register', '/help',
          '/support', '/contact', '/about', '/blog', '/news', '/testimonial',
          '/review', '/rating', '/star', '/checkmark', '/close', '/delete',
          '/edit', '/add', '/remove', '/plus', '/minus', '/play', '/pause'
        ];
        
        if (excludePatterns.some(pattern => urlLower.includes(pattern))) {
          return false;
        }
        
        // Exclude if in non-product container and no product indicators
        if (item.context.isInNonProductContainer && 
            !item.context.isInProductContainer && 
            !item.context.hasProductAlt && 
            !item.context.hasProductClass) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => b.score - a.score) // Sort by product image score (highest first)
      .map(item => item.url)
      .slice(0, 10); // Limit to top 10 most likely product images
    
    return filteredUrls;
  }

  /**
   * Calculate a score indicating how likely an image is a product image
   */
  calculateProductImageScore(url, context = {}) {
    let score = 0;
    const urlLower = url.toLowerCase();
    
    // Highest score for images from structured data (JSON-LD, Open Graph)
    if (context.isFromStructuredData) score += 20;
    
    // Higher score for images in product containers
    if (context.isInProductContainer) score += 10;
    if (context.hasProductAlt) score += 5;
    if (context.hasProductClass) score += 5;
    
    // Product-related URL patterns
    const productPatterns = [
      { pattern: '/product', score: 8 },
      { pattern: '/item', score: 7 },
      { pattern: '/goods', score: 7 },
      { pattern: '/catalog', score: 6 },
      { pattern: '/gallery', score: 5 },
      { pattern: '/p/', score: 8 },
      { pattern: '/item/', score: 7 },
      { pattern: 'epc-images', score: 10 }, // Common product image CDN
      { pattern: 'eparts-images', score: 10 }
    ];
    
    productPatterns.forEach(({ pattern, score: patternScore }) => {
      if (urlLower.includes(pattern)) {
        score += patternScore;
      }
    });
    
    // Penalize non-product indicators
    if (context.isInNonProductContainer) score -= 10;
    
    // Heavy penalty for browser logos and CDN UI elements
    if (urlLower.includes('browser-logos') || 
        urlLower.includes('cdnjs.cloudflare.com/ajax/libs/browser-logos')) {
      score -= 50;
    }
    
    return score;
  }

  /**
   * Resolve relative image URLs to absolute URLs
   */
  resolveImageUrl(url, baseUrl) {
    try {
      // Already absolute URL
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      // Protocol-relative URL
      if (url.startsWith('//')) {
        return baseUrl.protocol + url;
      }
      
      // Absolute path
      if (url.startsWith('/')) {
        return baseUrl.origin + url;
      }
      
      // Relative path
      return new URL(url, baseUrl.href).href;
    } catch (e) {
      return null;
    }
  }

  /**
   * Check if URL is a valid image URL
   */
  isValidImageUrl(url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const urlLower = url.toLowerCase();
    
    // Check if URL has image extension
    if (imageExtensions.some(ext => urlLower.includes(ext))) {
      return true;
    }
    
    // Check if URL contains image-related paths
    if (urlLower.includes('/image') || urlLower.includes('/img') || urlLower.includes('/photo') || urlLower.includes('/picture')) {
      return true;
    }
    
    return false;
  }

  /**
   * Normalize image URL by removing tracking/analytics parameters while preserving important ones
   * This helps identify duplicate images that differ only by query parameters
   */
  normalizeImageUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Remove common tracking/analytics parameters that don't affect the image
      const paramsToRemove = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'ref', 'referrer', 'source', 'campaign', 'fbclid', 'gclid',
        'twclid', 'li_fat_id', '_ga', '_gid', 'tracking', 'track',
        'clickid', 'affiliate', 'partner', 'pid', 'sid'
      ];
      
      paramsToRemove.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      // For Amazon images, normalize common size parameters that don't change the image
      // Amazon uses patterns like ?_AC_SL1500_ or similar - keep the base URL
      if (urlObj.hostname.includes('amazon') || urlObj.hostname.includes('amazonaws')) {
        // Remove Amazon-specific tracking parameters but keep size indicators if they're in the path
        const amazonTrackingParams = ['tag', 'linkCode', 'creative', 'creativeASIN', 'ref_'];
        amazonTrackingParams.forEach(param => {
          urlObj.searchParams.delete(param);
        });
      }
      
      return urlObj.toString();
    } catch (e) {
      // If URL parsing fails, return original
      return url;
    }
  }

  /**
   * Check if URL is likely a non-product image (logo, icon, etc.)
   */
  isLikelyNonProductImage(url) {
    const urlLower = url.toLowerCase();
    const filename = urlLower.split('/').pop().split('?')[0];
    
    // Exclude browser logos and CDN-based UI elements
    if (urlLower.includes('cdnjs.cloudflare.com/ajax/libs/browser-logos')) {
      return true;
    }
    if (urlLower.includes('browser-logos')) {
      return true;
    }
    
    // Exclude common CDN paths for UI elements
    const cdnUiPatterns = [
      'cdnjs.cloudflare.com',
      'jsdelivr.net',
      'unpkg.com'
    ];
    if (cdnUiPatterns.some(cdn => urlLower.includes(cdn)) && 
        (urlLower.includes('logo') || urlLower.includes('icon') || urlLower.includes('browser'))) {
      return true;
    }
    
    // Check filename for non-product indicators
    const nonProductFilenamePatterns = [
      'logo', 'icon', 'favicon', 'sprite', 'button', 'arrow',
      'social', 'share', 'badge', 'banner', 'avatar', 'profile',
      'placeholder', 'loading', 'spinner', 'nav', 'menu', 'search',
      'cart', 'checkout', 'account', 'user', 'sign', 'login',
      'close', 'delete', 'edit', 'add', 'remove', 'plus', 'minus',
      'chrome', 'firefox', 'edge', 'safari', 'browser' // Browser logos
    ];
    
    if (nonProductFilenamePatterns.some(pattern => filename.includes(pattern))) {
      return true;
    }
    
    // Check URL path for non-product indicators
    const nonProductPathPatterns = [
      '/logo', '/icon', '/favicon', '/sprite', '/button', '/arrow',
      '/social', '/share', '/badge', '/banner', '/header', '/footer',
      '/nav', '/navigation', '/menu', '/widget', '/sidebar',
      '/browser', '/browsers' // Browser-related paths
    ];
    
    if (nonProductPathPatterns.some(pattern => urlLower.includes(pattern))) {
      return true;
    }
    
    return false;
  }

  /**
   * Extract images from JSON-LD structured data
   */
  extractImagesFromJsonLd(data, baseUrl, imageUrls) {
    if (!data || typeof data !== 'object') return;
    
    // Handle arrays
    if (Array.isArray(data)) {
      for (const item of data) {
        this.extractImagesFromJsonLd(item, baseUrl, imageUrls);
      }
      return;
    }
    
    // Check for image property
    if (data.image) {
      if (typeof data.image === 'string') {
        const imgUrl = this.resolveImageUrl(data.image, baseUrl);
        if (imgUrl && this.isValidImageUrl(imgUrl)) {
          imageUrls.add(imgUrl);
        }
      } else if (Array.isArray(data.image)) {
        for (const img of data.image) {
          const imgUrl = this.resolveImageUrl(typeof img === 'string' ? img : img.url || img['@id'], baseUrl);
          if (imgUrl && this.isValidImageUrl(imgUrl)) {
            imageUrls.add(imgUrl);
          }
        }
      } else if (data.image.url || data.image['@id']) {
        const imgUrl = this.resolveImageUrl(data.image.url || data.image['@id'], baseUrl);
        if (imgUrl && this.isValidImageUrl(imgUrl)) {
          imageUrls.add(imgUrl);
        }
      }
    }
    
    // Recursively check nested objects
    for (const key in data) {
      if (key !== 'image' && typeof data[key] === 'object') {
        this.extractImagesFromJsonLd(data[key], baseUrl, imageUrls);
      }
    }
  }

  /**
   * Extract text from uploaded files
   */
  async extractTextFromFile(file) {
    // For now, return file name and basic info
    // In production, you'd use libraries like pdf-parse, mammoth, etc.
    const fileName = file.originalname || file.name || 'unknown';
    const fileType = file.mimetype || '';
    
    // If it's a text-based file, try to extract text
    if (fileType.includes('text') || fileType.includes('json')) {
      return file.buffer?.toString('utf-8') || '';
    }
    
    // For other file types, return metadata
    return `File: ${fileName}, Type: ${fileType}, Size: ${file.size} bytes`;
  }

  /**
   * Use OpenAI to extract assets from content
   */
  async extractAssetsWithAI(content, imageUrls = []) {
    // Re-initialize OpenAI in case env vars were added after module load
    if (!this.openai && process.env.OPENAI_API_KEY) {
      this.initializeOpenAI();
    }
    
    if (!this.openai) {
      console.log('OpenAI not initialized - checking env:', {
        hasKey: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY?.length || 0,
        keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'none'
      });
      // Fallback to basic extraction if OpenAI is not configured
      return this.extractAssetsBasic(content);
    }

    console.log('Using OpenAI for asset extraction...');
    
    try {
      const imageContext = imageUrls.length > 0 
        ? `\n\n=== AVAILABLE IMAGE URLs (PRODUCT IMAGES ONLY) ===\n${imageUrls.slice(0, 20).join('\n')}\n\nIMPORTANT: Only include images that are clearly PRODUCT IMAGES (showing the actual product/item being sold). DO NOT include:
- Logos, icons, or UI elements
- Navigation images, buttons, or decorative graphics
- User avatars or profile pictures
- Banner images or promotional graphics
- Social media icons or share buttons

Match images to products based on context, product names, and descriptions. Include 2-5 relevant PRODUCT images per product when available.`
        : '';

      const maxContentChars = parseInt(process.env.AI_EXTRACT_MAX_CONTENT_CHARS || '30000', 10);
      const trimmedContent = content.substring(0, maxContentChars);

      const prompt = `You are an expert at analyzing manufacturing, industrial, and e-commerce content to extract complete product information.

Analyze the following content and extract ALL identifiable products, materials, equipment, or services. For EACH asset found, extract EVERY available detail including:

REQUIRED FIELDS:
- name: Full product/asset name (e.g., "Steering Wheel Assembly #45100-02Z10-C0")
- type: One of "product", "equipment", "material", or "service"
- description: Comprehensive description with all relevant details

DETAILED SPECIFICATIONS (extract ALL available):
- material: Material type, composition, or grade if mentioned
- dimensions: All dimension information (length, width, height, diameter, etc.)
- form: Form factor (tubing, sheet, bar, assembly, component, etc.)
- weight: Weight if mentioned
- specifications: Any technical specifications, part numbers, SKUs, model numbers
- manufacturer: Manufacturer name if mentioned
- partNumber: Part number, SKU, or product code
- price: Price if mentioned (extract numeric value only)
- currency: Currency if mentioned (USD, CAD, etc.)
- quantity: Quantity available if mentioned
- availability: Availability status if mentioned
- condition: Condition (new, used, refurbished) if mentioned
- compatibility: Compatibility information if mentioned
- attributes: Any other relevant attributes or features

IMAGES:
- images: Array of image URLs that are relevant to this product. CRITICAL: Only include PRODUCT IMAGES (images showing the actual product/item). Exclude logos, icons, UI elements, banners, avatars, and decorative graphics. Match images to products based on context, product names, and descriptions. IMPORTANT: Include MULTIPLE product images (2-5) for each product when available. Do not limit to just 1 image - include all relevant product images.

ADDITIONAL FIELDS:
- attribute3: Additional important attribute or specification
- attribute4: Additional important attribute or specification

IMPORTANT:
- Extract EVERY product/asset found in the content, not just one
- Include ALL available details for each product
- If the content describes a single product with many details, extract ALL those details
- Preserve part numbers, model numbers, SKUs, and other identifiers
- Extract pricing information if available
- Extract all specifications and technical details
- Match image URLs to products when possible - include MULTIPLE relevant PRODUCT images (2-5) in the "images" array for each product. Only include images that show the actual product/item being sold. Exclude logos, icons, UI elements, and decorative graphics. If multiple product images are available for a product, include them all rather than just one.

Return a JSON object with an "assets" array. Each asset should be a complete object with all available fields including an "images" array.

Content to analyze:
${trimmedContent}${imageContext}`;

      console.log('Sending request to OpenAI...');
      const openAiCall = this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert product information extractor. You extract complete, detailed product information from any source. Always return valid JSON with an "assets" array containing all found products with all their details.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Lower temperature for more consistent extraction
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });
      const openAiTimeoutMs = parseInt(process.env.AI_EXTRACT_OPENAI_TIMEOUT_MS || '45000', 10);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`OpenAI extraction timeout after ${openAiTimeoutMs}ms`)), openAiTimeoutMs);
      });
      const response = await Promise.race([openAiCall, timeoutPromise]);

      const responseContent = response.choices[0].message.content;
      console.log('OpenAI response received, length:', responseContent.length);
      
      const result = JSON.parse(responseContent);
      
      // Handle both {assets: [...]} and direct array responses
      let assets = [];
      if (result.assets && Array.isArray(result.assets)) {
        assets = result.assets;
      } else if (Array.isArray(result)) {
        assets = result;
      } else {
        // Try to find any array in the result
        for (const key in result) {
          if (Array.isArray(result[key])) {
            assets = result[key];
            break;
          }
        }
      }
      
      // Ensure each asset has an images array, and if not provided by AI, try to match images
      // Track which images have been assigned to avoid duplicates
      const assignedImages = new Set();
      
      assets = assets.map(asset => {
        if (!asset.images || !Array.isArray(asset.images)) {
          asset.images = [];
        }
        
        // Deduplicate images already assigned by AI
        asset.images = [...new Set(asset.images)];
        
        // Mark already assigned images
        asset.images.forEach(img => assignedImages.add(img));
        
        // If AI assigned very few images (0-1) and we have more available, add more
        if (asset.images.length <= 1 && imageUrls.length > asset.images.length) {
          // Find unassigned images to add (deduplicated)
          const unassignedImages = imageUrls.filter(img => !assignedImages.has(img));
          
          // Add up to 4 more images (total of 5 max per product)
          const imagesToAdd = unassignedImages.slice(0, 5 - asset.images.length);
          asset.images.push(...imagesToAdd);
          
          // Deduplicate again after adding
          asset.images = [...new Set(asset.images)];
          
          // Mark these as assigned
          imagesToAdd.forEach(img => assignedImages.add(img));
        }
        
        return asset;
      });
      
      console.log(`Extracted ${assets.length} asset(s) from content`);
      return assets;
    } catch (error) {
      console.error('Error extracting assets with AI:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code
      });
      // Fallback to basic extraction
      return this.extractAssetsBasic(content);
    }
  }

  /**
   * Basic asset extraction without AI (fallback)
   */
  extractAssetsBasic(content) {
    const assets = [];
    const contentLower = content.toLowerCase();
    
    // Look for common product patterns
    const patterns = [
      { type: 'material', keywords: ['steel', 'aluminum', 'stainless', 'titanium', 'inconel'] },
      { type: 'equipment', keywords: ['cnc', 'mill', 'lathe', 'machine', 'equipment'] },
      { type: 'service', keywords: ['service', 'machining', 'cutting', 'welding', 'fabrication'] },
      { type: 'product', keywords: ['part', 'component', 'assembly', 'bracket', 'fitting'] }
    ];

    // Simple extraction - find sentences with product-like keywords
    const sentences = content.split(/[.!?]\s+/);
    let assetCount = 0;
    
    for (const sentence of sentences) {
      if (assetCount >= 10) break; // Limit to 10 assets
      
      for (const pattern of patterns) {
        if (pattern.keywords.some(kw => sentence.toLowerCase().includes(kw))) {
          const words = sentence.split(/\s+/).slice(0, 10).join(' ');
          assets.push({
            name: words.substring(0, 100) || 'Unnamed Asset',
            type: pattern.type,
            description: sentence.substring(0, 200),
            attribute3: 'N/A',
            attribute4: 'N/A'
          });
          assetCount++;
          break;
        }
      }
    }

    return assets.length > 0 ? assets : [
      {
        name: 'Example Auto Part 1',
        type: 'product',
        description: 'Desc 1',
        attribute3: 'Value',
        attribute4: 'Value'
      }
    ];
  }

  /**
   * Main method to extract assets from URLs and files
   */
  async extractAssetsFromSources(urls, files) {
    let allContent = '';
    const extractedAssets = [];

    console.log('Starting asset extraction from sources...');
    console.log('URLs:', urls.length);
    console.log('Files:', files.length);
    console.log('OpenAI initialized:', !!this.openai);

    // Process URLs
    const allImageUrls = [];
    const fetchErrors = [];
    for (const url of urls) {
      let result = null;
      let lastError = null;
      const maxRetries = 1; // Try fallback once for 403 errors
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`Trying fallback fetch method for URL: ${url} (attempt ${attempt})`);
            // Wait a bit before retry to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
            result = await this.fetchWebsiteContentFallback(url);
          } else {
            console.log(`Fetching content from URL: ${url}`);
            const startTime = Date.now();
            
            // Add a wrapper timeout to catch any hanging operations.
            // Keep this bounded so the frontend request does not time out first.
            const urlFetchPromise = this.fetchWebsiteContent(url);
            const urlFetchTimeoutMs = parseInt(process.env.AI_FETCH_URL_TIMEOUT_MS || '60000', 10);
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error(`Operation timeout: The request took longer than ${urlFetchTimeoutMs}ms`)), urlFetchTimeoutMs);
            });
            
            result = await Promise.race([urlFetchPromise, timeoutPromise]);
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`Fetched in ${elapsed}s`);
          }
          
          if (result && result.text) {
            console.log(`Fetched ${result.text.length} characters from ${url}${attempt > 0 ? ' (using fallback)' : ''}`);
            allContent += `\n\n--- Content from ${url}${attempt > 0 ? ' (fallback)' : ''} ---\n\n${result.text}`;
            
            // Collect image URLs
            if (result.imageUrls && result.imageUrls.length > 0) {
              console.log(`Found ${result.imageUrls.length} images from ${url}`);
              allImageUrls.push(...result.imageUrls);
            }
            break; // Success, exit retry loop
          } else {
            console.log(`No content fetched from ${url}`);
            if (attempt === maxRetries) {
              fetchErrors.push({ url, error: 'No content returned from URL' });
            }
          }
        } catch (error) {
          lastError = error;
          const errorMsg = error.message || 'Unknown error';
          console.error(`Error processing URL ${url} (attempt ${attempt + 1}/${maxRetries + 1}):`, errorMsg);
          
          // For 403 errors, try fallback method on retry
          if ((errorMsg.includes('403') || errorMsg.includes('forbidden')) && attempt < maxRetries) {
            console.log(`403 error detected, will try fallback fetch method on next attempt...`);
            continue; // Try fallback on next iteration
          }
          
          // If this was the last attempt, record the error
          if (attempt === maxRetries) {
            fetchErrors.push({ url, error: errorMsg });
            
            // For Amazon specifically, provide helpful message
            if (url.includes('amazon.com')) {
              console.error(`Amazon URL failed. Amazon has strict bot protection that blocks automated requests.`);
            }
          }
        }
      }
    }
    
    // If all URLs failed, throw an error with details
    if (urls.length > 0 && allContent.length === 0 && fetchErrors.length > 0) {
      const errorMessages = fetchErrors.map(e => `${e.url}: ${e.error}`).join('; ');
      throw new Error(`Failed to fetch content from all URLs. Errors: ${errorMessages}`);
    }

    // Process files
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.originalname || file.name}`);
        const content = await this.extractTextFromFile(file);
        if (content) {
          allContent += `\n\n--- Content from ${file.originalname || file.name} ---\n\n${content}`;
        }
      } catch (error) {
        console.error(`Error processing file ${file.originalname || file.name}:`, error);
      }
    }

    if (!allContent.trim()) {
      console.log('No content extracted from sources');
      return [];
    }

    console.log(`Total content length: ${allContent.length} characters`);
    console.log(`Total images found: ${allImageUrls.length}`);
    
    // Normalize and deduplicate image URLs to avoid assigning the same image multiple times
    // Normalize URLs by removing common tracking/analytics parameters that don't affect the image
    const normalizedImageUrls = allImageUrls.map(url => this.normalizeImageUrl(url));
    const uniqueImageUrls = [...new Set(normalizedImageUrls)];
    console.log(`Unique images after normalization and deduplication: ${uniqueImageUrls.length} (from ${allImageUrls.length} total)`);

    // Extract assets using AI or basic extraction
    const assets = await this.extractAssetsWithAI(allContent, uniqueImageUrls);
    
    console.log(`Final assets extracted: ${assets.length}`);
    
    // Map asset types to match expected format and ensure all fields are present
    return assets.map(asset => {
      const mapped = {
        name: asset.name || 'Unnamed Asset',
        type: asset.type || 'product',
        description: asset.description || asset.specifications || '',
        material: asset.material || '',
        dimensions: asset.dimensions || '',
        form: asset.form || '',
        weight: asset.weight || '',
        specifications: asset.specifications || asset.description || '',
        manufacturer: asset.manufacturer || '',
        partNumber: asset.partNumber || asset.part_number || asset.sku || asset.SKU || '',
        price: asset.price || '',
        currency: asset.currency || '',
        quantity: asset.quantity || '',
        availability: asset.availability || '',
        condition: asset.condition || '',
        compatibility: asset.compatibility || '',
        attribute3: asset.attribute3 || asset.specifications || asset.partNumber || '',
        attribute4: asset.attribute4 || asset.manufacturer || asset.compatibility || '',
        ...asset, // Preserve any additional fields
        assetType: this.mapAssetTypeToDPPType(asset.type || asset.assetType)
      };
      
      // Build a more comprehensive description if we have multiple fields
      if (!mapped.description && (mapped.specifications || mapped.partNumber || mapped.manufacturer)) {
        const descParts = [];
        if (mapped.manufacturer) descParts.push(`Manufacturer: ${mapped.manufacturer}`);
        if (mapped.partNumber) descParts.push(`Part #: ${mapped.partNumber}`);
        if (mapped.specifications) descParts.push(`Specs: ${mapped.specifications}`);
        if (mapped.dimensions) descParts.push(`Dimensions: ${mapped.dimensions}`);
        if (mapped.material) descParts.push(`Material: ${mapped.material}`);
        mapped.description = descParts.join(' | ') || mapped.description;
      }
      
      return mapped;
    });
  }

  /**
   * Map extracted asset type to DPP asset type
   */
  mapAssetTypeToDPPType(type) {
    const typeMap = {
      'product': 'finished_part',
      'equipment': 'equipment',
      'material': 'raw_material',
      'service': 'service'
    };
    return typeMap[type?.toLowerCase()] || 'raw_material';
  }

  /**
   * Generate EDI content using AI
   */
  async generateEDIContent(prompt) {
    // Re-initialize OpenAI in case env vars were added after module load
    if (!this.openai && process.env.OPENAI_API_KEY) {
      this.initializeOpenAI();
    }
    
    if (!this.openai) {
      console.log('OpenAI not initialized for EDI generation');
      return null;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an EDI (Electronic Data Interchange) expert specializing in ANSI X12 standards. Generate complete, valid EDI transactions following X12 format requirements. Always return structured JSON data that can be used to create EDI transactions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating EDI content with AI:', error);
      return null;
    }
  }
}

export default new AIService();


