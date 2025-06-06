import Contact from '../models/Contact.js';
export const getContacts = async (req, res) => {

  try {
    const contacts = await Contact.find();
    // const count = await Contact.countDocuments();
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
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
