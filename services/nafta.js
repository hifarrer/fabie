import db from './db.js';
import { v4 as uuidv4 } from 'uuid';

const NAFTA_COUNTRIES = ['CAN', 'USA', 'MEX'];
const RVC_THRESHOLD = 0.60; // 60% minimum for NAFTA qualification

class NAFTAService {
  async getInputsByDppId(dppId) {
    await db.read();
    return db.data.naftaInputs.filter(i => i.dppId === dppId);
  }

  async addInput(dppId, inputData) {
    await db.read();
    
    const newInput = {
      id: uuidv4(),
      dppId,
      name: inputData.name,
      category: inputData.category, // raw_material, direct_labor, overhead, packaging, other
      country: inputData.country,
      cost: parseFloat(inputData.cost),
      supplierDeclaration: inputData.supplierDeclaration || null,
      createdAt: new Date().toISOString()
    };

    db.data.naftaInputs.push(newInput);
    await db.write();

    // Recalculate RVC for the DPP
    await this.calculateRVC(dppId);

    return newInput;
  }

  async updateInput(inputId, updates) {
    await db.read();
    const index = db.data.naftaInputs.findIndex(i => i.id === inputId);
    
    if (index === -1) {
      throw new Error('Input not found');
    }

    const dppId = db.data.naftaInputs[index].dppId;

    db.data.naftaInputs[index] = {
      ...db.data.naftaInputs[index],
      ...updates,
      cost: updates.cost ? parseFloat(updates.cost) : db.data.naftaInputs[index].cost,
      updatedAt: new Date().toISOString()
    };

    await db.write();

    // Recalculate RVC
    await this.calculateRVC(dppId);

    return db.data.naftaInputs[index];
  }

  async deleteInput(inputId) {
    await db.read();
    const input = db.data.naftaInputs.find(i => i.id === inputId);
    
    if (!input) {
      throw new Error('Input not found');
    }

    const dppId = input.dppId;
    db.data.naftaInputs = db.data.naftaInputs.filter(i => i.id !== inputId);
    await db.write();

    // Recalculate RVC
    await this.calculateRVC(dppId);

    return true;
  }

  async calculateRVC(dppId) {
    await db.read();
    
    const inputs = db.data.naftaInputs.filter(i => i.dppId === dppId);
    const dpp = db.data.dpps.find(d => d.id === dppId);

    if (!dpp) {
      throw new Error('DPP not found');
    }

    if (inputs.length === 0) {
      dpp.nafta = {
        enabled: false,
        rvc: null,
        qualifies: null,
        breakdown: null,
        calculatedAt: null
      };
      await db.write();
      return dpp.nafta;
    }

    // Calculate totals
    const totalCost = inputs.reduce((sum, i) => sum + i.cost, 0);
    
    // Calculate by country
    const byCountry = {
      CAN: inputs.filter(i => i.country === 'CAN').reduce((sum, i) => sum + i.cost, 0),
      USA: inputs.filter(i => i.country === 'USA').reduce((sum, i) => sum + i.cost, 0),
      MEX: inputs.filter(i => i.country === 'MEX').reduce((sum, i) => sum + i.cost, 0),
      OTHER: inputs.filter(i => !NAFTA_COUNTRIES.includes(i.country)).reduce((sum, i) => sum + i.cost, 0)
    };

    const naftaCost = byCountry.CAN + byCountry.USA + byCountry.MEX;
    const rvcRatio = totalCost > 0 ? naftaCost / totalCost : 0;
    const rvcPercentage = Math.round(rvcRatio * 100);

    // Calculate percentages for display
    const breakdown = {
      canada: totalCost > 0 ? Math.round((byCountry.CAN / totalCost) * 100) : 0,
      usa: totalCost > 0 ? Math.round((byCountry.USA / totalCost) * 100) : 0,
      mexico: totalCost > 0 ? Math.round((byCountry.MEX / totalCost) * 100) : 0,
      other: totalCost > 0 ? Math.round((byCountry.OTHER / totalCost) * 100) : 0,
      totalCost,
      naftaCost
    };

    dpp.nafta = {
      enabled: true,
      rvc: rvcPercentage,
      qualifies: rvcRatio >= RVC_THRESHOLD,
      threshold: 60,
      method: 'transaction_value',
      breakdown,
      calculatedAt: new Date().toISOString()
    };

    await db.write();
    return dpp.nafta;
  }

  async enableNAFTATracking(dppId) {
    await db.read();
    const dpp = db.data.dpps.find(d => d.id === dppId);
    
    if (!dpp) {
      throw new Error('DPP not found');
    }

    dpp.nafta = {
      enabled: true,
      rvc: null,
      qualifies: null,
      breakdown: null,
      calculatedAt: null
    };

    await db.write();
    return dpp.nafta;
  }

  async generateCertificate(dppId) {
    await db.read();
    const dpp = db.data.dpps.find(d => d.id === dppId);
    const inputs = db.data.naftaInputs.filter(i => i.dppId === dppId);

    if (!dpp || !dpp.nafta?.qualifies) {
      throw new Error('DPP does not qualify for NAFTA certificate');
    }

    // In MVP, return certificate data structure
    // In production, this would generate an actual PDF
    return {
      certificateId: `COO-${Date.now()}`,
      formType: 'CBSA Form B232',
      generatedAt: new Date().toISOString(),
      exporter: dpp.seller,
      product: {
        name: dpp.name,
        hsCode: dpp.specs?.hsCode || 'N/A',
        description: dpp.description
      },
      originData: {
        rvc: dpp.nafta.rvc,
        method: 'Transaction Value',
        preferenceCriterion: 'B', // Goods wholly obtained or produced
        inputs: inputs.map(i => ({
          name: i.name,
          country: i.country,
          cost: i.cost
        }))
      },
      certification: {
        statement: 'I certify that the goods described in this document qualify as originating goods for purposes of preferential tariff treatment under CUSMA/USMCA.',
        status: 'DRAFT - REQUIRES SIGNATURE'
      }
    };
  }
}

export default new NAFTAService();


