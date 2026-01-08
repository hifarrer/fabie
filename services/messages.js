import db from './db.js';
import { v4 as uuidv4 } from 'uuid';
import dppService from './dpp.js';

class MessageService {
  async getThreads(userId) {
    await db.read();
    
    // Get all threads where user is participant
    const threads = db.data.threads.filter(t => 
      t.participants.includes(userId)
    );

    // Enrich with last message and DPP info
    const enrichedThreads = await Promise.all(threads.map(async (thread) => {
      const messages = db.data.messages.filter(m => m.threadId === thread.id);
      const lastMessage = messages.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )[0];

      const dpp = db.data.dpps.find(d => d.id === thread.dppId);
      const otherUserId = thread.participants.find(p => p !== userId);
      const otherUser = db.data.users.find(u => u.id === otherUserId);

      return {
        ...thread,
        lastMessage,
        dpp,
        otherUser,
        unreadCount: messages.filter(m => 
          !m.readAt && m.fromUserId !== userId
        ).length
      };
    }));

    return enrichedThreads.sort((a, b) => 
      new Date(b.lastMessage?.createdAt || b.createdAt) - 
      new Date(a.lastMessage?.createdAt || a.createdAt)
    );
  }

  async getThread(threadId) {
    await db.read();
    const thread = db.data.threads.find(t => t.id === threadId);
    
    if (!thread) return null;

    const messages = db.data.messages
      .filter(m => m.threadId === threadId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const dpp = db.data.dpps.find(d => d.id === thread.dppId);
    const participants = thread.participants.map(pId => 
      db.data.users.find(u => u.id === pId)
    );

    return {
      ...thread,
      messages,
      dpp,
      participants
    };
  }

  async createThread(fromUserId, toUserId, dppId) {
    await db.read();

    // Check if thread already exists for this DPP between these users
    const existingThread = db.data.threads.find(t => 
      t.dppId === dppId && 
      t.participants.includes(fromUserId) && 
      t.participants.includes(toUserId)
    );

    if (existingThread) {
      return existingThread;
    }

    const newThread = {
      id: uuidv4(),
      dppId,
      participants: [fromUserId, toUserId],
      createdAt: new Date().toISOString()
    };

    db.data.threads.push(newThread);
    await db.write();

    return newThread;
  }

  async sendMessage(threadId, fromUserId, content) {
    await db.read();

    const thread = db.data.threads.find(t => t.id === threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    const newMessage = {
      id: uuidv4(),
      threadId,
      fromUserId,
      content,
      createdAt: new Date().toISOString(),
      readAt: null
    };

    db.data.messages.push(newMessage);

    // Update thread's updatedAt
    thread.updatedAt = new Date().toISOString();

    // Increment inquiries on DPP if this is the first message
    const existingMessages = db.data.messages.filter(m => m.threadId === threadId);
    if (existingMessages.length === 1) {
      await dppService.incrementInquiries(thread.dppId);
    }

    await db.write();

    return newMessage;
  }

  async markAsRead(threadId, userId) {
    await db.read();

    const messages = db.data.messages.filter(m => 
      m.threadId === threadId && 
      m.fromUserId !== userId && 
      !m.readAt
    );

    const now = new Date().toISOString();
    messages.forEach(m => {
      m.readAt = now;
    });

    await db.write();
    return messages.length;
  }

  async startConversation(fromUserId, dppId, initialMessage) {
    await db.read();

    const dpp = db.data.dpps.find(d => d.id === dppId);
    if (!dpp) {
      throw new Error('DPP not found');
    }

    const toUserId = dpp.sellerId;

    // Create or get thread
    const thread = await this.createThread(fromUserId, toUserId, dppId);

    // Send initial message
    const message = await this.sendMessage(thread.id, fromUserId, initialMessage);

    return { thread, message };
  }
}

export default new MessageService();


