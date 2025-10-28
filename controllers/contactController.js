import Contact from '../models/Contact.js';
export const getContacts = async (req, res, next) => {

  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;
  const filters = {};

  const isAdmin = req.user?.role === 'admin';

  if (isAdmin) {
    if (req.query.user.id) filters.owner = filters.owner = req.query.user.id;
  } else {
    filters.owner = req.user.id;
  }

  if (req.query.name) filters.name = new RegExp(req.query.name, 'i');
  if (req.query.phone) filters.phone = new RegExp(req.query.phone, 'i');
  if (req.query.address) filters.address = new RegExp(req.query.address, 'i');
  try {
    const contacts = await Contact.find({ ...filters }).lean().skip(offset).limit(limit).exec();
    const normalizedContacts = contacts.map(contact => ({
      ...contact,
      _id: contact._id.toString(),
      owner: contact.owner?.toString() ?? contact.owner,
    }));
    const totalContacts = await Contact.countDocuments({ ...filters });
    const totalPages = Math.ceil(totalContacts / limit);
    return res.status(200).json({ totalContacts, page, totalPages, contacts: normalizedContacts });
  } catch (err) {
    next(err);
  }
};

export const createContact = async (req, res, next) => {
  const { name, phone, address, notes } = req.body;
  const owner = req.user?.id;

  try {
    const newContact = new Contact({ name, phone, address, notes, owner });
    await newContact.save();
    res.status(201).json(newContact);
  } catch (err) {
    // Validation or duplicate errors can be handled here, but unexpected errors go to next()
    next(err);
  }
};

export const updateContact = async (req, res, next) => {
  const { id } = req.params;
  const { name, phone, address, notes } = req.body;
  const isAdmin = req.user?.role === 'admin';

  try {
    const criteria = isAdmin ? { _id: id } : { _id: id, owner: req.user.id };

    const updated = await Contact.findOneAndUpdate(
      criteria,
      { name, phone, address, notes },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Contact not found' });

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteContact = async (req, res, next) => {
  const { id } = req.params;
  const isAdmin = req.user?.role === 'admin';

  try {
    const criteria = isAdmin ? { _id: id } : { _id: id, owner: req.user.id };

    const deleted = await Contact.findOneAndDelete(criteria);
    if (!deleted) return res.status(404).json({ error: 'Contact not found' });

    res.json({ message: 'Contact deleted' });
  } catch (err) {
    next(err);
  }
};