import Contact from '../models/Contact.js';
export const getContacts = async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;
  const filters = {};
  if (req.query.name) filters.name = new RegExp(req.query.name, 'i');
  if (req.query.phone) filters.phone = new RegExp(req.query.phone, 'i');
  if (req.query.address) filters.address = new RegExp(req.query.address, 'i');
  try {
    const contacts = await Contact.find({ ...filters }).lean().skip(offset).limit(limit).exec();
    const normalizedContacts = contacts.map(contact => ({
      ...contact,
      _id: contact._id.toString()
    }));
    const totalContacts = await Contact.countDocuments({ ...filters });
    const totalPages = Math.ceil(totalContacts / limit);
    return res.status(200).json({ totalContacts, page, totalPages, contacts: normalizedContacts });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

export const createContact = async (req, res) => {
  const { name, phone, address, notes } = req.body;
  if (!name || !phone || !address) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const newContact = new Contact({ name, phone, address, notes });
    await newContact.save();
    res.status(201).json(newContact);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// edit contact
export const updateContact = async (req, res) => {
  const { id } = req.params;
  const { name, phone, address, notes } = req.body;

  try {
    const updated = await Contact.findByIdAndUpdate(id, { name, phone, address, notes }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

export const deleteContact = async (req, res) => {
  const { id } = req.params;
  try {
    await Contact.findByIdAndDelete(id);
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    res.status(500).json(err.message);
  }
};
