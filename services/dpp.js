import db from './db.js';
import { v4 as uuidv4 } from 'uuid';

class DPPService {
  async getAll(filters = {}) {
    await db.read();
    let dpps = [...db.data.dpps];

    // Apply filters
    if (filters.assetType && filters.assetType !== 'all') {
      dpps = dpps.filter(d => d.assetType === filters.assetType);
    }

    if (filters.location && filters.location !== 'all') {
      dpps = dpps.filter(d => 
        d.seller?.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.naftaContent !== undefined && filters.naftaContent !== null) {
      const minContent = parseInt(filters.naftaContent, 10);
      // Only apply filter if minContent > 0 (0 means show all)
      if (minContent > 0) {
        dpps = dpps.filter(d => {
          const rvc = d.nafta?.rvc;
          return rvc !== null && rvc !== undefined && rvc >= minContent;
        });
      }
    }

    if (filters.verification && filters.verification !== 'any') {
      const tierOrder = ['basic', 'document_supported', 'fully_verified', 'third_party_certified'];
      const minTierIndex = tierOrder.indexOf(filters.verification);
      dpps = dpps.filter(d => {
        const dppTierIndex = tierOrder.indexOf(d.verification?.tier || 'basic');
        return dppTierIndex >= minTierIndex;
      });
    }

    if (filters.intellectualProperty && filters.intellectualProperty.length > 0) {
      dpps = dpps.filter(d => {
        const ip = d.intellectualProperty || [];
        return filters.intellectualProperty.some(filterIp => 
          ip.some(dppIp => dppIp.toLowerCase() === filterIp.toLowerCase())
        );
      });
    }

    if (filters.shopCompliance && filters.shopCompliance.length > 0) {
      dpps = dpps.filter(d => {
        const compliance = d.shopCompliance || [];
        return filters.shopCompliance.some(filterComp => 
          compliance.some(dppComp => dppComp.toLowerCase() === filterComp.toLowerCase())
        );
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      dpps = dpps.filter(d => 
        d.name?.toLowerCase().includes(searchLower) ||
        d.description?.toLowerCase().includes(searchLower) ||
        d.seller?.name?.toLowerCase().includes(searchLower) ||
        d.specs?.material?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by createdAt desc by default
    dpps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return dpps;
  }

  async getById(id) {
    await db.read();
    const dpp = db.data.dpps.find(d => d.id === id);
    
    // Increment views
    if (dpp) {
      dpp.views = (dpp.views || 0) + 1;
      await db.write();
    }
    
    return dpp;
  }

  async getBySellerId(sellerId) {
    await db.read();
    return db.data.dpps.filter(d => d.sellerId === sellerId);
  }

  async create(dppData) {
    await db.read();
    
    const newDpp = {
      id: uuidv4(),
      ...dppData,
      views: 0,
      inquiries: 0,
      status: dppData.status || 'active',
      verification: {
        tier: 'basic',
        badges: []
      },
      nafta: {
        enabled: false,
        rvc: null,
        qualifies: null
      },
      intellectualProperty: dppData.intellectualProperty || [],
      shopCompliance: dppData.shopCompliance || [],
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.data.dpps.push(newDpp);
    await db.write();
    
    return newDpp;
  }

  async update(id, updates) {
    await db.read();
    const index = db.data.dpps.findIndex(d => d.id === id);
    
    if (index === -1) {
      throw new Error('DPP not found');
    }

    db.data.dpps[index] = {
      ...db.data.dpps[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await db.write();
    return db.data.dpps[index];
  }

  async delete(id) {
    await db.read();
    const index = db.data.dpps.findIndex(d => d.id === id);
    
    if (index === -1) {
      throw new Error('DPP not found');
    }

    db.data.dpps.splice(index, 1);
    await db.write();
    
    return true;
  }

  async addDocument(dppId, document) {
    await db.read();
    const dpp = db.data.dpps.find(d => d.id === dppId);
    
    if (!dpp) {
      throw new Error('DPP not found');
    }

    const newDoc = {
      id: uuidv4(),
      ...document,
      status: 'uploaded',
      uploadedAt: new Date().toISOString()
    };

    dpp.documents = dpp.documents || [];
    dpp.documents.push(newDoc);
    
    // Auto-upgrade to document_supported if first formal document
    if (dpp.verification?.tier === 'basic' && 
        ['mill_cert', 'calibration_cert', 'capability_statement'].includes(document.type)) {
      dpp.verification.tier = 'document_supported';
    }

    await db.write();
    return newDoc;
  }

  async getFeatured(limit = 6) {
    await db.read();
    return db.data.dpps
      .filter(d => d.status === 'active')
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, limit);
  }

  async incrementInquiries(id) {
    await db.read();
    const dpp = db.data.dpps.find(d => d.id === id);
    if (dpp) {
      dpp.inquiries = (dpp.inquiries || 0) + 1;
      await db.write();
    }
    return dpp;
  }
}

export default new DPPService();


