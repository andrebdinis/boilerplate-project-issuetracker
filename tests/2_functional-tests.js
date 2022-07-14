const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
// documentation: https://www.chaijs.com/plugins/chai-http/

const apiIssues = "/api/issues/"
const apitestRoute = apiIssues + "apitest";

suite('Functional Tests', function() {
  this.timeout(5000);
  
  suite("POST requests", function() {
    
    test("#1 Create an issue with every field: POST request to /api/issues/{project}", function(done) {
      const chaiTest = "Chai Test 1";
      const inputObj = {
        issue_title: chaiTest,
        issue_text: chaiTest,
        created_by: chaiTest,
        assigned_to: chaiTest,
        status_text: chaiTest
      };
      chai
        .request(server)
        .post(apitestRoute)
        .type("form")
        .send(inputObj)
        .end((err, res) => {
          if(err) return console.error(err);
          assert.equal(res.status, 200);
          assert.equal(res.type, "application/json");
          assert.equal(res.body.issue_title, "Chai Test 1");
          assert.equal(res.body.issue_text, chaiTest);
          assert.equal(res.body.created_by, chaiTest);
          assert.equal(res.body.assigned_to, chaiTest);
          assert.equal(res.body.status_text, chaiTest);
          done();
        });
    });
    test("#2 Create an issue with only required fields: POST request to /api/issues/{project}", function(done) {
      const chaiTest = "Chai Test 2";
      const inputObj = {
        issue_title: chaiTest,
        issue_text: chaiTest,
        created_by: chaiTest
      }
      chai
        .request(server)
        .post(apitestRoute)
        .type("form")
        .send(inputObj)
        .end((err, res) => {
          if(err) return console.error(err);
          assert.equal(res.status, 200);
          assert.equal(res.type, "application/json");
          assert.equal(res.body.issue_title, chaiTest);
          assert.equal(res.body.issue_text, chaiTest);
          assert.equal(res.body.created_by, chaiTest);
          done();
        });
    });
    test("#3 Create an issue with missing required fields: POST request to /api/issues/{project}", function(done) {
      const chaiTest = "Chai Test 3";
      const inputObj = {
        issue_title: chaiTest,
        assigned_to: chaiTest
      }
      const expectedErrorMessageObj = {
        error: 'required field(s) missing'
      };
      chai
        .request(server)
        .post(apitestRoute)
        .type("form")
        .send(inputObj)
        .end((err, res) => {
          if(err) return console.error(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, JSON.stringify(expectedErrorMessageObj));
          done();
        });
    });
  });

  
  suite("GET requests", function() {
    
    test("#4 View issues on a project: GET request to /api/issues/{project}", function(done) {
      chai
        .request(server)
        .get(apitestRoute)
        .end((err, res) => {
          if(err) return console.error(err);
          assert.equal(res.status, 200);
          assert.isArray(JSON.parse(res.text));
          done();
        });
    });
    test("#5 View issues on a project with one filter: GET request to /api/issues/{project}", function(done) {
      const queryObj = { issue_title: "Chai Test 1" };
      chai
        .request(server)
        .get(apitestRoute)
        .query(queryObj)
        //.get(apitestRoute + "?issue_title=Chai+Test+1")
        .end((err, res) => {
          if(err) return console.error(err);
          const issuesArray = JSON.parse(res.text);
          const filteredObj = issuesArray[0];
          assert.equal(res.status, 200);
          assert.isArray(issuesArray);
          assert.isAbove(issuesArray.length, 0);
          assert.isObject(filteredObj);
          assert.equal(filteredObj.issue_title, "Chai Test 1");
          done();
        });
    });
    test("#6 View issues on a project with multiple filters: GET request to /api/issues/{project}", function(done) {
      const chaiTest = "Chai Test 2";
      const queryObj = { issue_title: chaiTest, issue_text: chaiTest, created_by: chaiTest, assigned_to: "", open:1}; //boolean values in chai http query must be passed as numbers, i.e. 1 instead of true, 0 instead of false
      chai
        .request(server)
        .get(apitestRoute)
        .query(queryObj)
        .end((err, res) => {
          if(err) return console.error(err);
          const issuesArray = JSON.parse(res.text);
          const filteredObj = issuesArray[0];
          assert.equal(res.status, 200);
          assert.isArray(issuesArray);
          assert.isNotEmpty(issuesArray);
          assert.isObject(filteredObj);
          assert.equal(filteredObj.issue_title, chaiTest);
          assert.equal(filteredObj.issue_text, chaiTest);
          assert.equal(filteredObj.created_by, chaiTest);
          assert.equal(filteredObj.assigned_to, "");
          assert.equal(filteredObj.status_text, "");
          assert.equal(filteredObj.open, true);
          done();
        });
    });
  });


  suite("PUT requests", function() {
    
    test("#7 Update one field on an issue: PUT request to /api/issues/{project}", function(done) {

      // gets _id of last 3rd issue (object) from issues array
      chai
        .request(server)
        .get(apitestRoute)
        .end((err, res) => {
          if(err) return console.error(err);
          assert.equal(res.status, 200);
          const id = JSON.parse(res.text).at(-3)._id.toString();

          // updates issue (object) with found _id
          // and checks if it returns a "successful object"
          const updateObj = {
            _id: id,
            issue_title: "UPDATED TITLE 1"
          };
          const expectedUpdateResponseObj = {
            result : "successfully updated",
            '_id' : id
          };
          chai
            .request(server)
            .put(apitestRoute)
            .type('form')
            .send(updateObj)
            .end((err, res) => {
              if(err) return console.error(err);
              assert.equal(res.status, 200);
              assert.equal(res.text, JSON.stringify(expectedUpdateResponseObj));

              // checks if issue's updated field is indeed updated
              chai
                .request(server)
                .get(apitestRoute)
                .end((err, res) => {
                  if(err) return console.error(err);
                  assert.equal(res.status, 200);
                  const last3obj = JSON.parse(res.text).at(-3);
                  assert.equal(last3obj.issue_title, "UPDATED TITLE 1");
                  done();
                });
            });
        });
    });
    test("#8 Update multiple fields on an issue: PUT request to /api/issues/{project}", function(done) {
      
      // gets _id of last 2nd issue (object) from issues array
      chai
        .request(server)
        .get(apitestRoute)
        .end((err, res) => {
          if(err) return console.error(err);
          assert.equal(res.status, 200);
          const id = JSON.parse(res.text).at(-2)._id.toString();

          // updates issue (object) with found _id
          // and checks if it returns a "successful object"
          const updateObj = {
            _id: id,
            issue_text: "UPDATED TEXT 2",
            created_by: "UPDATED CREATED BY 2",
            status_text: "UPDATED STATUS TEXT 2",
            open: false
          };
          const expectedUpdateResponseObj = {
            result : "successfully updated",
            '_id' : id
          };
          chai
            .request(server)
            .put(apitestRoute)
            .type('form')
            .send(updateObj)
            .end((err, res) => {
              if(err) return console.error(err);
              assert.equal(res.status, 200);
              assert.equal(res.text, JSON.stringify(expectedUpdateResponseObj));

              // checks if issue's updated fields are indeed updated
              chai
                .request(server)
                .get(apitestRoute)
                .end((err, res) => {
                  if(err) return console.error(err);
                  assert.equal(res.status, 200);
                  const last2obj = JSON.parse(res.text).at(-2);
                  assert.equal(last2obj.issue_text, "UPDATED TEXT 2");
                  assert.equal(last2obj.created_by, "UPDATED CREATED BY 2");
                  assert.equal(last2obj.status_text, "UPDATED STATUS TEXT 2");
                  assert.equal(last2obj.open, false);
                  done();
                });
            });
        });
    });
    test("#9 Update an issue with missing _id: PUT request to /api/issues/{project}", function(done) {
      const updateObj = {
        issue_title: "UPDATED TITLE WITH MISSING ID"
      };
      const expectedError = { error: 'missing _id' };
      
      chai
        .request(server)
        .put(apitestRoute)
        .type("form")
        .send(updateObj)
        .end((err, res) => {
          if(err) return console.error(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, JSON.stringify(expectedError));
          done();
        });
    });
    test("#10 Update an issue with no fields to update: PUT request to /api/issues/{project}", function(done) {

      // gets _id of last issue (object) from issues array
      chai
        .request(server)
        .get(apitestRoute)
        .end((err, res) => {
          if(err) return console.error(err);
          assert.equal(res.status, 200);
          const id = JSON.parse(res.text).at(-1)._id.toString();

          // tries to update issue (object) with found _id
          // and checks if it returns an "error object"
          const updateObj = {
            _id: id
          };
          const expectedError = {
            error: 'no update field(s) sent',
            '_id': id
          };
          chai
            .request(server)
            .put(apitestRoute)
            .type("form")
            .send(updateObj)
            .end((err, res) => {
              if(err) return console.error(err);
              assert.equal(res.status, 200);
              assert.equal(res.text, JSON.stringify(expectedError));
              done();
            });
        });
    });
    test("#11 Update an issue with an invalid _id: PUT request to /api/issues/{project}", function(done) {
      const invalidId = "8sdjd92jd383dn3d38RANDOMID";
      const updateObj = {
        _id: invalidId
      };
      const expectedError = {
        error: 'no update field(s) sent',
        '_id': invalidId
      };
      chai
        .request(server)
        .put(apitestRoute)
        .type("form")
        .send(updateObj)
        .end((err, res) => {
          if(err) return console.error(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, JSON.stringify(expectedError));
          done();
        });
    });
  });


  suite("DELETE requests", function() {
    
    test("#12 Delete an issue: DELETE request to /api/issues/{project}", function(done) {

      // gets _id of last issue (object) from issues array
      chai
        .request(server)
        .get(apitestRoute)
        .end((err, res) => {
          if(err) return console.error(err);
          assert.equal(res.status, 200);
          const id = JSON.parse(res.text).at(-1)._id.toString();

          // tries to delete issue (object) with found _id
          // and checks if it returns a "success object"
          const deleteObj = {
            _id: id
          };
          const expectedSuccess = {
            result : "successfully deleted",
            _id : id
          };
          chai
            .request(server)
            .delete(apitestRoute)
            .type("form")
            .send(deleteObj)
            .end((err, res) => {
              if(err) return console.error(err);
              assert.equal(res.status, 200);
              assert.equal(res.text, JSON.stringify(expectedSuccess));
              done();
            });
        });
    });
    test("#13 Delete an issue with an invalid _id: DELETE request to /api/issues/{project}", function(done) {
      const invalidId = "3dj89ud3h88d9kd3kRANDOMID";
      const deleteObj = {
        _id: invalidId
      };
      const expectedError = {
        error : "could not delete",
        '_id' : invalidId
      };
      chai
        .request(server)
        .delete(apitestRoute)
        .type("form")
        .send(deleteObj)
        .end((err, res) => {
          if(err) return console.error(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, JSON.stringify(expectedError));
          done();
        });
    });
    test("#14 Delete an issue with missing _id: DELETE request to /api/issues/{project}", function(done) {
      const deleteObj = {};
      const expectedError = { error: 'missing _id' };
      chai
        .request(server)
        .delete(apitestRoute)
        .type("form")
        .send(deleteObj)
        .end((err, res) => {
          if(err) return console.error(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, JSON.stringify(expectedError));
          done();
        });
    });
  });

  
});
