import { Router, Request, Response } from 'express';
import multer from 'multer';
import { db, SupportTicket, UPLOADS_DIR } from '../db.js';

export const ticketsRouter = Router();
const upload = multer({ dest: UPLOADS_DIR, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/tickets?customerId=...
ticketsRouter.get('/', (req: Request, res: Response) => {
  const customerId = req.query.customerId as string;
  let tickets = db.getTickets();

  if (customerId) {
    tickets = tickets.filter((t) => t.customerId === customerId);
  }

  return res.json({ tickets });
});

// GET /api/tickets/:id
ticketsRouter.get('/:id', (req: Request, res: Response) => {
  const ticket = db.getTickets().find((t) => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  return res.json({ ticket });
});

// POST /api/tickets
ticketsRouter.post('/', upload.single('attachment'), (req: Request, res: Response) => {
  try {
    const { customerId, category, subject, priority, message } = req.body;
    if (!customerId || !category || !subject || !message) {
      return res.status(400).json({ error: 'Customer ID, category, subject, and message are required' });
    }

    const customer = db.getUsers().find((u) => u.id === customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const ticketId = `TIK-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const newTicket: SupportTicket = {
      id: ticketId,
      customerId,
      customerName: customer.fullName,
      customerEmail: customer.email,
      category,
      subject,
      priority: priority || 'medium',
      status: 'open',
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: `MSG-${Date.now()}`,
          senderId: customer.id,
          senderName: customer.fullName,
          senderRole: 'customer',
          message,
          attachmentName: req.file?.originalname,
          attachmentUrl: req.file ? `/storage/uploads/${req.file.filename}` : undefined,
          createdAt: now,
        },
      ],
    };

    db.addTicket(newTicket);

    // Notification to customer
    db.addNotification({
      id: `NOTIF-${Date.now()}`,
      recipientEmail: customer.email,
      recipientId: customer.id,
      type: 'TICKET_CREATED',
      subject: `[${ticketId}] Support Request Received: ${subject}`,
      messageHtml: `<p>Your ticket <strong>${ticketId}</strong> has been opened. Our support engineering staff will respond shortly.</p>`,
      isRead: false,
      sentAt: now,
    });

    return res.status(201).json({ message: 'Support ticket submitted successfully', ticket: newTicket });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets/:id/reply
ticketsRouter.post('/:id/reply', upload.single('attachment'), (req: Request, res: Response) => {
  try {
    const ticket = db.getTickets().find((t) => t.id === req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const { senderId, senderName, senderRole, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message cannot be empty' });

    const now = new Date().toISOString();
    const newMsg = {
      id: `MSG-${Date.now()}`,
      senderId: senderId || 'SYSTEM',
      senderName: senderName || 'Support Representative',
      senderRole: (senderRole as 'customer' | 'staff' | 'system') || 'customer',
      message,
      attachmentName: req.file?.originalname,
      attachmentUrl: req.file ? `/storage/uploads/${req.file.filename}` : undefined,
      createdAt: now,
    };

    const newStatus = senderRole === 'staff' ? 'waiting_customer' : 'in_progress';
    const updatedMessages = [...ticket.messages, newMsg];

    const updated = db.updateTicket(ticket.id, {
      messages: updatedMessages,
      status: ticket.status === 'closed' ? 'open' : newStatus,
    });

    return res.json({ message: 'Reply sent', ticket: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/tickets/:id/status
ticketsRouter.put('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const valid = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const updated = db.updateTicket(req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'Ticket not found' });

  return res.json({ message: 'Ticket status updated', ticket: updated });
});
