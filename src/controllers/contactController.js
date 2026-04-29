const Contact = require('../models/Contact');

/**
 * Helper: build owner filter depending on admin or normal user
 */
const buildOwnerFilter = (req) => {
  const isAdmin = req.user?.role === 'admin';
  if (isAdmin && req.query.user && req.query.user.id) return { owner: req.query.user.id };
  return { owner: req.user.id };
};

/**
 * GET /contacts
 * Supports:
 * - existing field filters (name, phone, address)
 * - full-text search via `search`
 * - tags filtering: ?tags=work,urgent&tagLogic=AND|OR
 * - category filtering: ?category=work
 * - favorite filtering: ?isFavorite=true
 * - sorting: ?sortBy=name|createdAt|updatedAt&sortOrder=asc|desc
 * - pagination: ?page=1&limit=10
 * Response: { contacts: [], pagination: { total, page, limit, pages }, filters: { ... } }
 */
const getContacts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const filters = buildOwnerFilter(req);

    // Existing field-level regex searches
    if (req.query.name) filters.name = new RegExp(req.query.name, 'i');
    if (req.query.phone) filters.phone = new RegExp(req.query.phone, 'i');
    if (req.query.address) filters.address = new RegExp(req.query.address, 'i');

    // Category filter validation
    if (req.query.category) {
      const category = req.query.category;
      const allowed = ['personal', 'work', 'family', 'business', 'other'];
      if (!allowed.includes(category)) return res.status(400).json({ error: 'Invalid category' });
      filters.category = category;
    }

    // isFavorite filter
    if (typeof req.query.isFavorite !== 'undefined') {
      const val = String(req.query.isFavorite).toLowerCase();
      if (val === 'true') filters.isFavorite = true;
      else if (val === 'false') filters.isFavorite = false;
      else return res.status(400).json({ error: 'isFavorite must be true or false' });
    }

    // Tags filtering
    if (req.query.tags) {
      const tagsRaw = String(req.query.tags).split(',').map(t => t.toLowerCase().trim()).filter(Boolean);
      if (tagsRaw.length > 0) {
        const tagLogic = (req.query.tagLogic || 'OR').toUpperCase();
        if (!['AND', 'OR'].includes(tagLogic)) return res.status(400).json({ error: 'tagLogic must be AND or OR' });
        if (tagLogic === 'AND') {
          filters.tags = { $all: tagsRaw };
        } else {
          filters.tags = { $in: tagsRaw };
        }
      }
    }

    // Text search (prefer full-text if `search` provided)
    let useText = false;
    const queryParts = [];
    if (req.query.search) {
      useText = true;
      queryParts.push({ $text: { $search: req.query.search } });
    }

    // Combine filters
    const finalQuery = useText ? { $and: [ { ...filters }, ...(queryParts) ] } : { ...filters };

    // Sorting
    const allowedSort = ['name', 'createdAt', 'updatedAt'];
    const sortBy = req.query.sortBy && allowedSort.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortObj = {};
    if (useText) {
      // If text search, we can sort by relevance score first then by requested sort
      sortObj.score = { $meta: 'textScore' };
      sortObj[sortBy] = sortOrder;
    } else {
      sortObj[sortBy] = sortOrder;
    }

    // Execute query
    const findQuery = Contact.find(finalQuery).sort(sortObj).skip(offset).limit(limit).lean();
    if (useText) findQuery.select({ score: { $meta: 'textScore' } });

    const contacts = await findQuery.exec();
    const total = await Contact.countDocuments(finalQuery);
    const pages = Math.ceil(total / limit) || 1;

    // normalize ids
    const normalized = contacts.map(c => ({ ...c, _id: c._id.toString(), owner: c.owner?.toString?.() ?? c.owner }));

    return res.status(200).json({
      contacts: normalized,
      pagination: { total, page, limit, pages },
      filters: {
        search: req.query.search || null,
        tags: req.query.tags ? req.query.tags.split(',').map(t => t.trim()) : [],
        tagLogic: req.query.tagLogic || 'OR',
        category: req.query.category || null,
        isFavorite: typeof req.query.isFavorite !== 'undefined' ? req.query.isFavorite : null,
        sortBy,
        sortOrder: req.query.sortOrder || 'desc'
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /contacts/favorites
 * Returns favorite contacts for the logged-in user (supports pagination & sorting via same query params)
 */
const getFavorites = async (req, res, next) => {
  // forward to getContacts with isFavorite=true
  req.query.isFavorite = 'true';
  return getContacts(req, res, next);
};

/**
 * PATCH /contacts/:id/favorite
 * Toggle favorite status for a contact owned by the user
 */
const toggleFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';
    const criteria = isAdmin ? { _id: id } : { _id: id, owner: req.user.id };

    const contact = await Contact.findOne(criteria);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    contact.isFavorite = !contact.isFavorite;
    await contact.save();
    return res.status(200).json({ message: 'Favorite toggled', contact });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /contacts/tags
 * Returns unique tags used by the logged-in user
 */
const getTags = async (req, res, next) => {
  try {
    const ownerFilter = buildOwnerFilter(req);
    const tags = await Contact.distinct('tags', ownerFilter);
    const sorted = (tags || []).map(t => String(t)).sort();
    return res.status(200).json({ tags: sorted });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /contacts/categories/:category
 * Filter contacts by category (supports pagination/sort)
 */
const getByCategory = async (req, res, next) => {
  req.query.category = req.params.category;
  return getContacts(req, res, next);
};

/**
 * PATCH /contacts/:id/tags
 * Body: { add: ['tag1'], remove: ['tag2'] }
 * Validates tags, ensures no duplicates and max 10 tags per contact
 */
const updateTags = async (req, res, next) => {
  try {
    const ownerFilter = buildOwnerFilter(req);
    const { id } = req.params;
    const criteria = { ...ownerFilter, _id: id };

    const { add = [], remove = [] } = req.body;
    if (!Array.isArray(add) || !Array.isArray(remove)) return res.status(400).json({ error: 'add and remove must be arrays' });

    const normalize = arr => arr.map(t => (typeof t === 'string' ? t.toLowerCase().trim().slice(0, 20) : '')).filter(Boolean);
    const toAdd = normalize(add);
    const toRemove = normalize(remove);

    // fetch contact
    const contact = await Contact.findOne(criteria);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    // current tags set
    const current = new Set((contact.tags || []).map(t => t.toLowerCase().trim()));

    // remove tags
    for (const r of toRemove) current.delete(r);

    // add tags ensuring uniqueness
    for (const a of toAdd) current.add(a);

    const finalTags = Array.from(current).slice(0, 10); // enforce max 10
    if (finalTags.length > 10) return res.status(400).json({ error: 'Resulting tags exceed maximum allowed (10)' });

    contact.tags = finalTags;
    await contact.save();
    return res.status(200).json({ message: 'Tags updated', tags: contact.tags, contact });
  } catch (err) {
    next(err);
  }
};

// keep create/update/delete but include tags/category/isFavorite support
const createContact = async (req, res, next) => {
  const { name, phone, address, notes, tags = [], category = null, isFavorite = false } = req.body;
  const owner = req.user?.id;

  try {
    const newContact = new Contact({ name, phone, address, notes, owner, tags, category, isFavorite });
    await newContact.save();
    res.status(201).json(newContact);
  } catch (err) {
    next(err);
  }
};

const updateContact = async (req, res, next) => {
  const { id } = req.params;
  const { name, phone, address, notes, tags, category, isFavorite } = req.body;
  const isAdmin = req.user?.role === 'admin';

  try {
    const criteria = isAdmin ? { _id: id } : { _id: id, owner: req.user.id };

    const updatePayload = { name, phone, address, notes };
    if (typeof tags !== 'undefined') updatePayload.tags = tags;
    if (typeof category !== 'undefined') updatePayload.category = category;
    if (typeof isFavorite !== 'undefined') updatePayload.isFavorite = isFavorite;

    const updated = await Contact.findOneAndUpdate(
      criteria,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Contact not found' });

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

const deleteContact = async (req, res, next) => {
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

module.exports = {
  getContacts,
  getFavorites,
  toggleFavorite,
  getTags,
  getByCategory,
  updateTags,
  createContact,
  updateContact,
  deleteContact
};
