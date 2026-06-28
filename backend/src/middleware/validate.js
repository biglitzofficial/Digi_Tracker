const Joi = require('joi');

/** Joi string that accepts empty string (forms often send "" for optional fields). */
const emptyStr = Joi.string().allow('');
const optionalStr = emptyStr.optional();
const defaultEmptyStr = emptyStr.default('');

const entryValueSchema = Joi.object({
  fieldSlug: Joi.string().required(),
  value: Joi.alternatives().try(
    Joi.boolean(),
    Joi.number(),
    emptyStr,
    Joi.date(),
  ).required(),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/"/g, ''),
    }));
    const message = errors.length === 1
      ? errors[0].message
      : errors.map((e) => (e.field ? `${e.field}: ${e.message}` : e.message)).join('. ');
    return res.status(400).json({ success: false, message, errors });
  }
  req.body = value;
  next();
};

const fieldSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  slug: optionalStr,
  type: Joi.string().valid('number', 'text', 'date', 'dropdown', 'boolean', 'currency', 'percentage').required(),
  required: Joi.boolean().default(false),
  options: Joi.array().items(Joi.string().allow('')).default([]),
  defaultValue: Joi.any().optional(),
  openingBalance: Joi.alternatives().try(Joi.valid(null, ''), Joi.number().min(0)).optional(),
  order: Joi.number().default(0),
  isActive: Joi.boolean().optional(),
});

const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().trim().min(1).required(),
    lastName: Joi.string().trim().min(1).required(),
    businessName: Joi.string().trim().min(1).required(),
    businessType: Joi.string().trim().min(1).required(),
    contactNumber: optionalStr,
    timezone: Joi.string().default('UTC'),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required(),
  }),

  createStaff: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().trim().min(1).required(),
    lastName: Joi.string().trim().min(1).required(),
    role: Joi.string().valid('staff').default('staff'),
    phone: optionalStr,
  }),

  updateUser: Joi.object({
    firstName: Joi.string().trim().min(1).optional(),
    lastName: Joi.string().trim().min(1).optional(),
    phone: optionalStr,
    password: Joi.alternatives().try(Joi.valid(''), Joi.string().min(8)).optional(),
    avatar: optionalStr,
    fcmToken: optionalStr,
    isActive: Joi.boolean().optional(),
  }),

  registerFcmToken: Joi.object({
    fcmToken: Joi.string().trim().min(1).required(),
  }),

  updateBusiness: Joi.object({
    name: optionalStr,
    type: optionalStr,
    logo: optionalStr,
    address: Joi.object().optional(),
    contactNumber: optionalStr,
    timezone: optionalStr,
    branding: Joi.object().optional(),
    settings: Joi.object().optional(),
  }),

  createBusiness: Joi.object({
    name: Joi.string().trim().min(1).required(),
    type: Joi.string().trim().min(1).required(),
    email: Joi.string().email().required(),
    contactNumber: optionalStr,
    timezone: Joi.string().default('UTC'),
    ownerFirstName: Joi.string().trim().min(1).required(),
    ownerLastName: Joi.string().trim().min(1).required(),
    ownerEmail: Joi.string().email().required(),
    ownerPassword: Joi.string().min(8).required(),
  }),

  createModule: Joi.object({
    name: Joi.string().trim().min(1).required(),
    description: defaultEmptyStr,
    icon: Joi.string().default('chart-bar'),
    color: Joi.string().default('#6366F1'),
    fields: Joi.array().items(fieldSchema).min(1).required(),
  }),

  updateModule: Joi.object({
    name: Joi.string().trim().min(1).optional(),
    description: optionalStr,
    icon: optionalStr,
    color: optionalStr,
    fields: Joi.array().items(fieldSchema).optional(),
    isActive: Joi.boolean().optional(),
  }),

  createEntry: Joi.object({
    moduleId: Joi.string().required(),
    entryDate: Joi.date().required(),
    values: Joi.array().items(entryValueSchema).min(1).required(),
    notes: defaultEmptyStr,
  }),

  updateEntry: Joi.object({
    values: Joi.array().items(entryValueSchema).min(1).optional(),
    notes: optionalStr,
  }).or('values', 'notes'),

  generateReport: Joi.object({
    type: Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom').required(),
    format: Joi.string().valid('pdf', 'excel', 'csv').required(),
    period: Joi.object({
      start: Joi.date().required(),
      end: Joi.date().required(),
    }).required(),
    includeCharts: Joi.boolean().default(true),
    includeLeaderboard: Joi.boolean().default(true),
  }),
};

module.exports = { validate, schemas, emptyStr, optionalStr, defaultEmptyStr };
