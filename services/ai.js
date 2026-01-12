import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import db from './db.js';

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
   * Extract text content from a website URL
   */
  async fetchWebsiteContent(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }

      const html = await response.text();
      
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
      
      // Extract text content with better structure preservation
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
      
      // Add structured data if found
      if (jsonLdMatches.length > 0) {
        text = '\n=== STRUCTURED DATA ===\n' + jsonLdMatches.join('\n') + '\n\n=== PAGE CONTENT ===\n' + text;
      }
      
      return text.substring(0, 150000); // Increased limit for better extraction
    } catch (error) {
      console.error(`Error fetching URL ${url}:`, error);
      return null;
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
  async extractAssetsWithAI(content) {
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

Return a JSON object with an "assets" array. Each asset should be a complete object with all available fields.

Content to analyze:
${content.substring(0, 150000)}`;

      console.log('Sending request to OpenAI...');
      const response = await this.openai.chat.completions.create({
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
        max_tokens: 4000, // Increased for more detailed responses
        response_format: { type: 'json_object' }
      });

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
    for (const url of urls) {
      try {
        console.log(`Fetching content from URL: ${url}`);
        const content = await this.fetchWebsiteContent(url);
        if (content) {
          console.log(`Fetched ${content.length} characters from ${url}`);
          allContent += `\n\n--- Content from ${url} ---\n\n${content}`;
        } else {
          console.log(`No content fetched from ${url}`);
        }
      } catch (error) {
        console.error(`Error processing URL ${url}:`, error);
      }
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

    // Extract assets using AI or basic extraction
    const assets = await this.extractAssetsWithAI(allContent);
    
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


