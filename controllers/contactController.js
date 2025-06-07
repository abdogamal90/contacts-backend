import Contact from '../models/Contact.js';
export const getContacts = async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  try {
    const contacts = await Contact.find().skip(offset).limit(limit).exec();
    const totalContacts = await Contact.countDocuments({});
    const totalPages = Math.ceil(totalContacts / limit);
    return res.status(200).json({ totalContacts, page, totalPages, contacts });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

export const createContact = async (req, res) => {
  const data = req.body;
  if (!data.name || !data.phone || !data.address) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const newContact = new Contact(data);
    await newContact.save();
    res.status(201).json(newContact);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
