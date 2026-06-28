const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }
  req.body = value;
  next();
};

const fieldSchema = Joi.object({
  name: Joi.string().required(),
  slug: Joi.string().optional(),
  type: Joi.string().valid('number', 'text', 'date', 'dropdown', 'boolean', 'currency', 'percentage').required(),
  required: Joi.boolean().default(false),
  options: Joi.array().items(Joi.string()).default([]),
  defaultValue: Joi.any().optional(),
  order: Joi.number().default(0),
});

const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    businessName: Joi.string().required(),
    businessType: Joi.string().required(),
    contactNumber: Joi.string().optional(),
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
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    role: Joi.string().valid('staff').default('staff'),
    phone: Joi.string().optional(),
  }),

  updateUser: Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    phone: Joi.string().optional(),
    avatar: Joi.string().optional(),
    fcmToken: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
  }),

  registerFcmToken: Joi.object({
    fcmToken: Joi.string().required(),
  }),

  updateBusiness: Joi.object({
    name: Joi.string().optional(),
    type: Joi.string().optional(),
    logo: Joi.string().optional(),
    address: Joi.object().optional(),
    contactNumber: Joi.string().optional(),
    timezone: Joi.string().optional(),
    branding: Joi.object().optional(),
    settings: Joi.object().optional(),
  }),

  createModule: Joi.object({
    name: Joi.string().trim().min(1).required(),
    description: Joi.string().allow('').default(''),
    icon: Joi.string().default('chart-bar'),
    color: Joi.string().default('#6366F1'),
    fields: Joi.array().items(fieldSchema).min(1).required(),
  }),

  updateModule: Joi.object({
    name: Joi.string().trim().min(1).optional(),
    description: Joi.string().allow('').optional(),
    icon: Joi.string().optional(),
    color: Joi.string().optional(),
    fields: Joi.array().items(fieldSchema).optional(),
    isActive: Joi.boolean().optional(),
  }),

  createEntry: Joi.object({
    moduleId: Joi.string().required(),
    entryDate: Joi.date().required(),
    values: Joi.array().items(
      Joi.object({
        fieldSlug: Joi.string().required(),
        value: Joi.any().required(),
      })
    ).min(1).required(),
    notes: Joi.string().default(''),
  }),

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

module.exports = { validate, schemas };
