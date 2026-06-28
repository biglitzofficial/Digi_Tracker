const { schemas } = require('./validate');

function validateSchema(schema, body) {
  return schema.validate(body, { abortEarly: false, stripUnknown: true });
}

describe('API validation schemas', () => {
  describe('createEntry', () => {
    const base = {
      moduleId: 'mod123',
      entryDate: '2026-06-28',
      values: [{ fieldSlug: 'phone_calls', value: 0 }],
    };

    it('accepts empty notes', () => {
      const { error } = validateSchema(schemas.createEntry, { ...base, notes: '' });
      expect(error).toBeUndefined();
    });

    it('accepts omitted notes', () => {
      const { error } = validateSchema(schemas.createEntry, base);
      expect(error).toBeUndefined();
    });

    it('accepts zero and positive numeric values', () => {
      const { error } = validateSchema(schemas.createEntry, {
        ...base,
        values: [
          { fieldSlug: 'phone_calls', value: 0 },
          { fieldSlug: 'website_clicks', value: 12 },
        ],
        notes: '',
      });
      expect(error).toBeUndefined();
    });

    it('accepts negative numbers at schema level (service validates range)', () => {
      const { error } = validateSchema(schemas.createEntry, {
        ...base,
        values: [{ fieldSlug: 'phone_calls', value: -1 }],
        notes: '',
      });
      expect(error).toBeUndefined();
    });
  });

  describe('updateEntry', () => {
    it('accepts empty notes', () => {
      const { error } = validateSchema(schemas.updateEntry, { notes: '' });
      expect(error).toBeUndefined();
    });

    it('accepts values with empty text fields', () => {
      const { error } = validateSchema(schemas.updateEntry, {
        values: [{ fieldSlug: 'notes_field', value: '' }],
      });
      expect(error).toBeUndefined();
    });
  });

  describe('createStaff', () => {
    const base = {
      email: 'staff@test.com',
      password: 'Password1',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    it('accepts empty phone', () => {
      const { error } = validateSchema(schemas.createStaff, { ...base, phone: '' });
      expect(error).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('accepts empty phone and avatar', () => {
      const { error } = validateSchema(schemas.updateUser, { phone: '', avatar: '' });
      expect(error).toBeUndefined();
    });

    it('accepts empty password (unchanged)', () => {
      const { error } = validateSchema(schemas.updateUser, { password: '' });
      expect(error).toBeUndefined();
    });

    it('rejects short non-empty password', () => {
      const { error } = validateSchema(schemas.updateUser, { password: 'short' });
      expect(error).toBeDefined();
    });
  });

  describe('register', () => {
    const base = {
      email: 'owner@test.com',
      password: 'Password1',
      firstName: 'John',
      lastName: 'Doe',
      businessName: 'Acme',
      businessType: 'gym',
    };

    it('accepts empty contactNumber', () => {
      const { error } = validateSchema(schemas.register, { ...base, contactNumber: '' });
      expect(error).toBeUndefined();
    });
  });

  describe('updateBusiness', () => {
    it('accepts empty optional string fields', () => {
      const { error } = validateSchema(schemas.updateBusiness, {
        name: 'Acme',
        contactNumber: '',
        timezone: '',
        logo: '',
        type: '',
      });
      expect(error).toBeUndefined();
    });
  });

  describe('createModule', () => {
    it('accepts empty description', () => {
      const { error } = validateSchema(schemas.createModule, {
        name: 'Instagram',
        description: '',
        fields: [{ name: 'Followers', type: 'number' }],
      });
      expect(error).toBeUndefined();
    });
  });

  describe('updateModule', () => {
    it('accepts empty description', () => {
      const { error } = validateSchema(schemas.updateModule, { description: '' });
      expect(error).toBeUndefined();
    });
  });
});
