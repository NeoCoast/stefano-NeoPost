const { expect } = require('expect');
const itemsBusiness = require('../../src/business/item');
const { RESULT_CODES } = require('../../src/utils/constants');

describe('itemsBusiness.getAll', () => {
  it('should return an object with code and data', async () => {
    const result = await itemsBusiness.getAll();

    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('data');
    expect(result.code).toBe(RESULT_CODES.SUCCESS);
    expect(Array.isArray(result.data)).toBe(true);
  });
});

describe('itemsBusiness.getById', () => {
  it('should return NOT_FOUND for a non-existent ID', async () => {
    const result = await itemsBusiness.getById(999999999);

    expect(result.code).toBe(RESULT_CODES.NOT_FOUND);
    expect(result.data).toBeNull();
  });
});
