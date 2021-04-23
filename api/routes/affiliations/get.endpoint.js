const {
  getDB,
  setupDB,
  teardownDB,
  login,
  unauthenticatedTest,
  unauthorizedTest
} = require('../../endpoint-tests/utils');

// using state AK because it's the first in the affiliations
// list so it will be the first affiliation loaded into the
// user, change once user is set
describe('Affiliations endpoint | GET', () => {
  const api = login('all-permissions');
  const db = getDB();
  beforeAll(() => setupDB(db));
  afterAll(() => teardownDB(db));

  describe('GET /states/:stateId/affiliations', () => {
    unauthenticatedTest('get', '/states/ak/affiliations');
    unauthorizedTest('get', '/states/ak/affiliations');

    it('returns 200', async () => {
      const response = await api.get('/states/ak/affiliations');
      expect(response.status).toEqual(200);
    });
  });

  describe('GET /states/:stateId/affiliations/:id', () => {
    unauthenticatedTest('get', '/states/ak/affiliations/4000');
    unauthorizedTest('get', '/states/ak/affiliations/4000');

    it('returns 200', async () => {
      const response = await api.get('/states/ak/affiliations/4000');
      expect(response.status).toEqual(200);
    });

    it('returns 400', async () => {
      const response = await api.get('/states/ak/affiliations/9000');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /affiliations', () => {
    unauthenticatedTest('get', '/affiliations');
    unauthorizedTest('get', '/affiliations');

    it('returns 200', async () => {
      const response = await api.get('/affiliations');
      expect(response.status).toEqual(200);

    });

    it('returns only active users', async () => {
      const response = await api.get('/affiliations?status=active');
      expect(response.status).toEqual(200);
      response.data.forEach(affiliation =>{
        expect(affiliation.status).toEqual('approved')
        expect(affiliation).toMatchSnapshot({
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })

      })

    });
    it('returns only pending users', async () => {
      const response = await api.get('/affiliations?status=pending');
      expect(response.status).toEqual(200);
      response.data.forEach(affiliation =>{
        expect(affiliation.status).toEqual('requested')
        expect(affiliation).toMatchSnapshot({
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })

      })

    });

    it('returns only inactive users', async () => {
      const response = await api.get('/affiliations?status=inactive');
      expect(response.status).toEqual(200);
      response.data.forEach(affiliation =>{
        expect(['revoked', 'denied'].includes(affiliation.status)).toBeTruthy()
        expect(affiliation).toMatchSnapshot({
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })

      })

    });

    it('returns 200 with an invalid status argument', async () => {
      const response = await api.get('/affiliations?status=IRRELEVANT');
      expect(response.status).toEqual(200);
      expect(response.data).toEqual([])

    });

  });
});
