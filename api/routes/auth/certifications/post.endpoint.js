const FormData = require('form-data');

const {
  buildForm,
  login,
  unauthenticatedTest,
  unauthorizedTest
} = require('../../../endpoint-tests/utils');


describe('auth/certifications endpoints', () => {
  describe('POST /auth/certifications', () => {
    const validRequestBody = {
      "name": "Roger Klotz",
      "email": "fake@email.com",
      "phone": "4105555555",
      "state": "md",
      "certifiedByName": "Patty Mayonnaise",
      "certifiedByTitle": "Doctor",
      "certifiedByEmail": "yep@email.com",
      "certifiedBySignature": "Patty Mayonnaise",
      "fileUrl": "/auth/certifications/files/12345"
    }
    
    const url = '/auth/certifications'
    
    unauthenticatedTest('post', url);
    unauthorizedTest('post', url);

    describe('when authenticated as a user with permission', () => {
      let api;
      beforeAll(async () => {
        api = login();
      });

      it('with no request body', async () => {
        const response = await api.post(url, {});
        
        expect(response.status).toEqual(400);
        expect(response.data).toMatchSnapshot();
      });
      
      it('with a valid request body', async () => {
        const response = await api.post(url, validRequestBody);
        
        expect(response.status).toEqual(200);
        expect(response.data).toMatchSnapshot();
      });
    });
  });
});
