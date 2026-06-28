const entryService = require('../services/entryService');
const AppError = require('../utils/AppError');

describe('EntryService field validation', () => {
  const mod = {
    fields: [
      { slug: 'count', name: 'Count', type: 'number', required: true, isActive: true },
      { slug: 'rate', name: 'Rate', type: 'percentage', required: true, isActive: true },
    ],
  };

  const validate = (values) => entryService._validateFields(mod, values);

  it('rejects negative numbers', () => {
    expect(() => validate([
      { fieldSlug: 'count', value: -1 },
      { fieldSlug: 'rate', value: 0 },
    ])).toThrow('cannot be negative');
  });

  it('accepts zero', () => {
    expect(() => validate([
      { fieldSlug: 'count', value: 0 },
      { fieldSlug: 'rate', value: 0 },
    ])).not.toThrow();
  });

  it('rejects percentage above 100', () => {
    expect(() => validate([
      { fieldSlug: 'count', value: 1 },
      { fieldSlug: 'rate', value: 101 },
    ])).toThrow('between 0 and 100');
  });
});
