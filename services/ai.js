import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

class AIService {
  constructor() {
    this.materials = null;
    this.rules = null;
    this.applications = null;
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
}

export default new AIService();


