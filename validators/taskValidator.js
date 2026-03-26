/**
 * Task input validation and sanitization
 */

const { VALID_STATUSES, VALID_PRIORITIES } = require('../store');

function validateCreate(data) {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.push({ field: 'title', message: 'Title is required and must be a non-empty string' });
  } else if (data.title.trim().length > 200) {
    errors.push({ field: 'title', message: 'Title must be 200 characters or fewer' });
  }

  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' });
  } else if (data.description && data.description.length > 2000) {
    errors.push({ field: 'description', message: 'Description must be 2000 characters or fewer' });
  }

  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  if (data.priority !== undefined && !VALID_PRIORITIES.includes(data.priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push({ field: 'tags', message: 'Tags must be an array of strings' });
    } else if (data.tags.some((t) => typeof t !== 'string')) {
      errors.push({ field: 'tags', message: 'Each tag must be a string' });
    } else if (data.tags.length > 10) {
      errors.push({ field: 'tags', message: 'Maximum 10 tags allowed' });
    }
  }

  if (data.dueDate !== undefined && data.dueDate !== null) {
    const d = new Date(data.dueDate);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'dueDate', message: 'dueDate must be a valid ISO 8601 date string' });
    }
  }

  return errors;
}

function validateUpdate(data) {
  const errors = [];

  if (Object.keys(data).length === 0) {
    errors.push({ field: 'body', message: 'Request body must contain at least one field to update' });
    return errors;
  }

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || !data.title.trim()) {
      errors.push({ field: 'title', message: 'Title must be a non-empty string' });
    } else if (data.title.trim().length > 200) {
      errors.push({ field: 'title', message: 'Title must be 200 characters or fewer' });
    }
  }

  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' });
  }

  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  if (data.priority !== undefined && !VALID_PRIORITIES.includes(data.priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push({ field: 'tags', message: 'Tags must be an array of strings' });
    } else if (data.tags.some((t) => typeof t !== 'string')) {
      errors.push({ field: 'tags', message: 'Each tag must be a string' });
    } else if (data.tags.length > 10) {
      errors.push({ field: 'tags', message: 'Maximum 10 tags allowed' });
    }
  }

  if (data.dueDate !== undefined && data.dueDate !== null) {
    const d = new Date(data.dueDate);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'dueDate', message: 'dueDate must be a valid ISO 8601 date string' });
    }
  }

  // Block immutable fields
  ['id', 'createdAt', 'updatedAt'].forEach((field) => {
    if (data[field] !== undefined) {
      errors.push({ field, message: `Field '${field}' is read-only and cannot be updated` });
    }
  });

  return errors;
}

module.exports = { validateCreate, validateUpdate };
