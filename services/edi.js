import db from './db.js';
import { v4 as uuidv4 } from 'uuid';
import aiService from './ai.js';
import dppService from './dpp.js';

class EDIService {
  /**
   * EDI Transaction Types
   */
  static TRANSACTION_TYPES = {
    '850': { name: 'Purchase Order', direction: 'inbound', description: 'Buyer sends purchase order to seller' },
    '855': { name: 'Purchase Order Acknowledgment', direction: 'outbound', description: 'Seller acknowledges purchase order' },
    '856': { name: 'Ship Notice/Manifest', direction: 'outbound', description: 'Seller sends advance ship notice' },
    '810': { name: 'Invoice', direction: 'outbound', description: 'Seller sends invoice to buyer' },
    '820': { name: 'Payment Order/Remittance Advice', direction: 'inbound', description: 'Buyer sends payment information' },
    '997': { name: 'Functional Acknowledgment', direction: 'bidirectional', description: 'Confirms receipt of EDI transaction' },
    '940': { name: 'Warehouse Shipping Order', direction: 'inbound', description: 'Warehouse receives shipping order' }
  };

  /**
   * Check if EDI is applicable for asset type
   */
  isApplicable(assetType) {
    return ['raw_material', 'finished_part', 'equipment'].includes(assetType);
  }

  /**
   * Get all EDI transactions for a DPP
   */
  async getByDppId(dppId) {
    await db.read();
    return (db.data.ediTransactions || []).filter(t => t.dppId === dppId);
  }

  /**
   * Get EDI transaction by ID
   */
  async getById(transactionId) {
    await db.read();
    return (db.data.ediTransactions || []).find(t => t.id === transactionId);
  }

  /**
   * Create a new EDI transaction
   */
  async create(transactionData) {
    await db.read();
    
    // Verify DPP exists and EDI is applicable
    const dpp = await dppService.getById(transactionData.dppId);
    if (!dpp) {
      throw new Error('DPP not found');
    }
    
    if (!this.isApplicable(dpp.assetType)) {
      throw new Error('EDI is not applicable for service assets');
    }

    const transaction = {
      id: uuidv4(),
      ...transactionData,
      status: transactionData.status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!db.data.ediTransactions) {
      db.data.ediTransactions = [];
    }

    db.data.ediTransactions.push(transaction);
    await db.write();

    return transaction;
  }

  /**
   * Update EDI transaction
   */
  async update(transactionId, updates) {
    await db.read();
    const index = (db.data.ediTransactions || []).findIndex(t => t.id === transactionId);
    
    if (index === -1) {
      throw new Error('EDI transaction not found');
    }

    db.data.ediTransactions[index] = {
      ...db.data.ediTransactions[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await db.write();
    return db.data.ediTransactions[index];
  }

  /**
   * Delete EDI transaction
   */
  async delete(transactionId) {
    await db.read();
    const index = (db.data.ediTransactions || []).findIndex(t => t.id === transactionId);
    
    if (index === -1) {
      throw new Error('EDI transaction not found');
    }

    db.data.ediTransactions.splice(index, 1);
    await db.write();
    
    return true;
  }

  /**
   * Generate EDI 850 (Purchase Order) from DPP
   */
  async generate850(dppId, buyerInfo, orderDetails) {
    const dpp = await dppService.getById(dppId);
    if (!dpp) {
      throw new Error('DPP not found');
    }

    const transaction = {
      dppId,
      transactionType: '850',
      direction: 'inbound',
      buyer: buyerInfo,
      seller: {
        id: dpp.sellerId,
        name: dpp.seller?.name || 'Unknown',
        location: dpp.seller?.location || ''
      },
      items: [{
        itemNumber: dpp.specs?.partNumber || '1',
        description: dpp.name,
        quantity: orderDetails.quantity || 1,
        unitPrice: dpp.pricing?.basePrice || 0,
        unit: dpp.pricing?.unit || 'unit',
        currency: dpp.pricing?.currency || 'CAD',
        totalPrice: (orderDetails.quantity || 1) * (dpp.pricing?.basePrice || 0)
      }],
      orderDate: new Date().toISOString(),
      requestedShipDate: orderDetails.requestedShipDate || null,
      shippingAddress: orderDetails.shippingAddress || null,
      billingAddress: orderDetails.billingAddress || null,
      notes: orderDetails.notes || '',
      status: 'pending'
    };

    return await this.create(transaction);
  }

  /**
   * Generate EDI 855 (Purchase Order Acknowledgment) from 850
   */
  async generate855(poTransactionId, acknowledgmentDetails) {
    const po = await this.getById(poTransactionId);
    if (!po || po.transactionType !== '850') {
      throw new Error('Invalid purchase order transaction');
    }

    const transaction = {
      dppId: po.dppId,
      transactionType: '855',
      direction: 'outbound',
      relatedTransactionId: poTransactionId,
      buyer: po.buyer,
      seller: po.seller,
      items: po.items.map(item => ({
        ...item,
        acknowledgedQuantity: acknowledgmentDetails.items?.[item.itemNumber]?.quantity || item.quantity,
        status: acknowledgmentDetails.items?.[item.itemNumber]?.status || 'accepted',
        expectedShipDate: acknowledgmentDetails.items?.[item.itemNumber]?.expectedShipDate || null
      })),
      acknowledgmentDate: new Date().toISOString(),
      acknowledgmentStatus: acknowledgmentDetails.status || 'accepted', // accepted, rejected, partial
      notes: acknowledgmentDetails.notes || '',
      status: 'sent'
    };

    return await this.create(transaction);
  }

  /**
   * Generate EDI 856 (Ship Notice/Manifest) from 855
   */
  async generate856(ackTransactionId, shipmentDetails) {
    const ack = await this.getById(ackTransactionId);
    if (!ack || ack.transactionType !== '855') {
      throw new Error('Invalid acknowledgment transaction');
    }

    const transaction = {
      dppId: ack.dppId,
      transactionType: '856',
      direction: 'outbound',
      relatedTransactionId: ackTransactionId,
      buyer: ack.buyer,
      seller: ack.seller,
      items: ack.items.map(item => ({
        ...item,
        shippedQuantity: shipmentDetails.items?.[item.itemNumber]?.quantity || item.acknowledgedQuantity,
        trackingNumber: shipmentDetails.items?.[item.itemNumber]?.trackingNumber || null,
        carrier: shipmentDetails.items?.[item.itemNumber]?.carrier || null
      })),
      shipmentDate: shipmentDetails.shipmentDate || new Date().toISOString(),
      carrier: shipmentDetails.carrier || 'Unknown',
      trackingNumber: shipmentDetails.trackingNumber || null,
      shippingAddress: shipmentDetails.shippingAddress || null,
      status: 'sent'
    };

    return await this.create(transaction);
  }

  /**
   * Generate EDI 810 (Invoice) from 856
   */
  async generate810(shipmentTransactionId, invoiceDetails) {
    const shipment = await this.getById(shipmentTransactionId);
    if (!shipment || shipment.transactionType !== '856') {
      throw new Error('Invalid shipment transaction');
    }

    const subtotal = shipment.items.reduce((sum, item) => 
      sum + (item.shippedQuantity * item.unitPrice), 0);
    const tax = invoiceDetails.tax || 0;
    const shipping = invoiceDetails.shipping || 0;
    const total = subtotal + tax + shipping;

    const transaction = {
      dppId: shipment.dppId,
      transactionType: '810',
      direction: 'outbound',
      relatedTransactionId: shipmentTransactionId,
      buyer: shipment.buyer,
      seller: shipment.seller,
      invoiceNumber: invoiceDetails.invoiceNumber || `INV-${Date.now()}`,
      invoiceDate: new Date().toISOString(),
      items: shipment.items.map(item => ({
        ...item,
        invoicedQuantity: item.shippedQuantity,
        unitPrice: item.unitPrice,
        lineTotal: item.shippedQuantity * item.unitPrice
      })),
      subtotal,
      tax,
      shipping,
      total,
      paymentTerms: invoiceDetails.paymentTerms || 'Net 30',
      dueDate: invoiceDetails.dueDate || null,
      status: 'sent'
    };

    return await this.create(transaction);
  }

  /**
   * Generate EDI 820 (Payment Order/Remittance Advice) from 810
   */
  async generate820(invoiceTransactionId, paymentDetails) {
    const invoice = await this.getById(invoiceTransactionId);
    if (!invoice || invoice.transactionType !== '810') {
      throw new Error('Invalid invoice transaction');
    }

    const transaction = {
      dppId: invoice.dppId,
      transactionType: '820',
      direction: 'inbound',
      relatedTransactionId: invoiceTransactionId,
      buyer: invoice.buyer,
      seller: invoice.seller,
      paymentAmount: paymentDetails.amount || invoice.total,
      paymentDate: paymentDetails.paymentDate || new Date().toISOString(),
      paymentMethod: paymentDetails.paymentMethod || 'ACH',
      referenceNumber: paymentDetails.referenceNumber || null,
      invoiceNumber: invoice.invoiceNumber,
      items: invoice.items.map(item => ({
        itemNumber: item.itemNumber,
        invoiceLineNumber: item.itemNumber,
        amountPaid: paymentDetails.items?.[item.itemNumber]?.amount || item.lineTotal
      })),
      status: 'sent'
    };

    return await this.create(transaction);
  }

  /**
   * Generate EDI 997 (Functional Acknowledgment)
   */
  async generate997(relatedTransactionId, acknowledgmentStatus) {
    const related = await this.getById(relatedTransactionId);
    if (!related) {
      throw new Error('Related transaction not found');
    }

    const transaction = {
      dppId: related.dppId,
      transactionType: '997',
      direction: 'bidirectional',
      relatedTransactionId,
      buyer: related.buyer,
      seller: related.seller,
      acknowledgedTransactionType: related.transactionType,
      acknowledgmentStatus: acknowledgmentStatus || 'accepted', // accepted, rejected, accepted_with_errors
      acknowledgmentDate: new Date().toISOString(),
      status: 'sent'
    };

    return await this.create(transaction);
  }

  /**
   * Use AI to draft/update EDI transaction
   */
  async draftWithAI(dppId, transactionType, context = {}) {
    const dpp = await dppService.getById(dppId);
    if (!dpp) {
      throw new Error('DPP not found');
    }

    if (!this.isApplicable(dpp.assetType)) {
      throw new Error('EDI is not applicable for service assets');
    }

    // Use AI service to generate EDI content
    const prompt = this.buildAIPrompt(dpp, transactionType, context);
    
    try {
      const aiResponse = await aiService.generateEDIContent(prompt);
      const parsedData = this.parseAIResponse(aiResponse, transactionType, dppId, context);
      // Create the transaction from parsed AI data
      return await this.create(parsedData);
    } catch (error) {
      console.error('Error generating EDI with AI:', error);
      // Fallback to basic generation
      return await this.generateBasicTransaction(dpp, transactionType, context);
    }
  }

  /**
   * Build AI prompt for EDI generation
   */
  buildAIPrompt(dpp, transactionType, context) {
    const typeInfo = this.constructor.TRANSACTION_TYPES[transactionType];
    
    return `Generate an EDI ${transactionType} (${typeInfo.name}) transaction for the following Digital Product Passport:

DPP Information:
- Name: ${dpp.name}
- Asset Type: ${dpp.assetType}
- Description: ${dpp.description}
- Seller: ${dpp.seller?.name || 'Unknown'} (${dpp.seller?.location || ''})
- Price: ${dpp.pricing?.basePrice || 0} ${dpp.pricing?.currency || 'CAD'} per ${dpp.pricing?.unit || 'unit'}
- Available Quantity: ${dpp.availability?.quantity || 0}
- Lead Time: ${dpp.availability?.leadTimeDays || 0} days
- Specifications: ${JSON.stringify(dpp.specs || {})}

${context.buyer ? `Buyer Information: ${JSON.stringify(context.buyer)}` : ''}
${context.orderDetails ? `Order Details: ${JSON.stringify(context.orderDetails)}` : ''}
${context.notes ? `Additional Notes: ${context.notes}` : ''}

Generate a complete, valid EDI ${transactionType} transaction following ANSI X12 standards. Include all required segments and data elements.`;
  }

  /**
   * Parse AI response into EDI transaction structure
   */
  parseAIResponse(aiResponse, transactionType, dppId, context) {
    // This would parse the AI-generated EDI content
    // For now, return a structured transaction based on the type
    const baseTransaction = {
      dppId,
      transactionType,
      direction: this.constructor.TRANSACTION_TYPES[transactionType]?.direction || 'outbound',
      status: 'draft',
      aiGenerated: true,
      ...context
    };

    return baseTransaction;
  }

  /**
   * Generate basic transaction without AI (fallback)
   */
  async generateBasicTransaction(dpp, transactionType, context) {
    const transactionData = {
      dppId: dpp.id,
      transactionType,
      direction: this.constructor.TRANSACTION_TYPES[transactionType]?.direction || 'outbound',
      status: 'draft',
      seller: {
        id: dpp.sellerId,
        name: dpp.seller?.name || 'Unknown',
        location: dpp.seller?.location || ''
      },
      ...context
    };
    
    return await this.create(transactionData);
  }

  /**
   * Get transaction workflow for a DPP
   */
  async getWorkflow(dppId) {
    const transactions = await this.getByDppId(dppId);
    
    // Build workflow chain
    const workflow = {
      purchaseOrder: transactions.find(t => t.transactionType === '850'),
      acknowledgment: transactions.find(t => t.transactionType === '855'),
      shipNotice: transactions.find(t => t.transactionType === '856'),
      invoice: transactions.find(t => t.transactionType === '810'),
      payment: transactions.find(t => t.transactionType === '820'),
      acknowledgments: transactions.filter(t => t.transactionType === '997')
    };

    return workflow;
  }

  /**
   * Validate EDI transaction
   */
  validateTransaction(transaction) {
    const errors = [];

    if (!transaction.transactionType) {
      errors.push('Transaction type is required');
    }

    if (!transaction.dppId) {
      errors.push('DPP ID is required');
    }

    if (!this.constructor.TRANSACTION_TYPES[transaction.transactionType]) {
      errors.push(`Invalid transaction type: ${transaction.transactionType}`);
    }

    // Type-specific validation
    if (transaction.transactionType === '850' && !transaction.buyer) {
      errors.push('Buyer information is required for Purchase Order');
    }

    if (transaction.transactionType === '810' && !transaction.invoiceNumber) {
      errors.push('Invoice number is required for Invoice');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default new EDIService();
