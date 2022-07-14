// --------------------------------------------------------//
// NOTE:
// I had all the challenges working except 5 (get), 6 (get) and 7 (put), and the 14 tests (I had not come to that yet). I first implemented everything for "Issue" mongoose model to work only. Got stuck and struggling with those failures, and then by searching for FCC forum help I found the following replit project which helped me understand what was missing, to unstuck myself:
// https://replit.com/@murphy1188/issue-tracker#routes/api.js
// Only the GET method is identical to that project; everything else, it was myself that originally coded.
// --------------------------------------------------------//

'use strict';

const mongoose = require("mongoose");

// Connect to MongoDB (Database name: "exerciseTrackerDB")
mongoose
  .connect(process.env["MONGO_URI"], { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to database"))
  .catch(err => console.error("Could not connect to database", err) );

//------------------ MONGOOSE: ISSUE -----------------//
// Issue Schema
const issueSchema = new mongoose.Schema({
  //_id: mongoose.ObjectId,
  issue_title: {type:String,required:true},
  issue_text: {type:String,required:true},
  created_by: {type:String,required:[true, "Creator required"]},
  assigned_to: {type:String, default:""},
  status_text: {type:String, default:""},
  open: {type:Boolean, default:true},
  created_on: {type:Date, default:new Date().toISOString()},
  updated_on: {type:Date, default:new Date().toISOString()}
});
//------------------ MONGOOSE: PROJECT -----------------//
// Project Schema
const projectSchema = new mongoose.Schema({
  project: {type:String},
  issues: [issueSchema]
});
// Project Model Instance
const Project = mongoose.model('Project', projectSchema, "projects");
//----------------------------------------------------//

// DELETE DATABASE DOCUMENTS (if necessary)
/*
Project.deleteMany({}, (err, aknowledge) => {
  if(err) return console.error(err);
  console.log("success!", aknowledge)
});

Issue.deleteMany({}, (err, aknowledge) => {
  if(err) return console.error(err);
  console.log("success!", aknowledge)
});
*/


module.exports = function (app) {

  app.route('/api/issues/:project')

    //-------------- GET: GET ALL/QUERIED ISSUES -------------/
    // e.g. /api/issues/apitest?open=true&assigned_to=Joe
    .get(function (req, res){
      console.log("\/\/-----------GET-----------\/\/");
      //console.log("REQ.QUERY:", req.query)

      let projectName = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text, open } = req.query;
      
      // find project by name, populate its "issues" array and execute query
      Project.findOne({ project: projectName })
      .populate('issues')
      .exec((err, proj) => {
        if (err) return console.log(err);
        // project query was successfull (without error)
        // (returned project can still be "null")

        // if req.query is empty
        if (Object.keys(req.query).length === 0) {

          // if proj queried is "null" (not found)
          if (!proj) {

            // create new project (since it does not exist)
            Project.create({ project: projectName }, (err, newProj) => {
              if (err) return console.log(err);
              //console.log("Project created successfully:", newProj);
              return res.json(newProj.issues);
            });
          }

          // if proj queried is valid (found)
          if (proj) {
            console.log("Issues found:", proj.issues.length)
            return res.json(proj.issues);
          }
        }
        else {
          // req.query has valid properties

          // for each valid key in req.query, filter project's issues array for matching key-values
          Object.keys(req.query).forEach((key) => {

            // if a project's issue key-value matches a req.query key-value, then that issue is transfered to project's issues array
            proj.issues = proj.issues.filter(issue => (issue[key] == req.query[key]));
          });

          console.log("Issues found:", proj.issues.length);
          return res.json(proj.issues);
        }
      });

    })

    //-------------- POST: SUBMIT ISSUE -------------/
    .post(function (req, res){
      console.log("\/\/-----------POST-----------\/\/")
      //console.log("REQ.BODY:", req.body)

      let projectName = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      Project.findOne({ project: projectName})
      .populate('issues')
      .exec((err, proj) => {
        if(err) return console.error(err);

        if(Object.entries(req.body).length > 0) {

          // if proj queried is "null" (not found)
          if (proj == null) {

            // create new project (since it does not exist)
            Project.create({ project: projectName }, (err, newProj) => {
              if (err) return console.log(err);
              //console.log("Project created successfully:", newProj);
              
              // all the required fields are filled in ?
              if(issue_title && issue_text && created_by) {
                //console.log("All the required fields are included");
  
                newProj.issues.push(req.body);
                printPostSuccessProjectSave(newProj, res);
              }
              else {
                printPostErrorRequiredFieldsMissing(res);
              }
            });
          }

          // if proj queried is valid (found)
          if (proj) {
            //console.log("Project:", proj);
            
            // all the required fields are filled in ?
            if(issue_title && issue_text && created_by) {
              //console.log("All the required fields are included");

              proj.issues.push(req.body);
              printPostSuccessProjectSave(proj, res);
            }
            else {
              printPostErrorRequiredFieldsMissing(res);
            }
          }
        }
        else {
          printPostErrorRequiredFieldsMissing(res);
        }

      });
    })

    //-------------- PUT: UPDATE ISSUE -------------/
    .put(function (req, res){
      console.log("\/\/-----------PUT-----------\/\/")
      //console.log("REQ.BODY: ", req.body)
      
      let projectName = req.params.project;
      const reqBodyLength = Object.entries(req.body).length;
      
      if(reqBodyLength > 0){
        // req.body has one or more properties
        
        const id = req.body._id;

        // if "id" is not filled in
        if(!id) printPutErrorMissingId(res);
        else {
          // "id" field is included
          //console.log("'id' included")
          
          // if req.body has only "id" property filled in
          if(reqBodyLength === 1 && id) printPutErrorNoUpdateFieldsSent(id, res);
          else {
            // req.body has "id" and more properties filled in

            const { issue_title, issue_text, created_by, assigned_to, status_text} = req.body;
            const open = req.body.open ? false : true;
    
            //const open = req.body.open ? false : true; //opt // check checkbox to close issue (if false, it is open issue; if true, it is closed issue)
            //const updated_on = new Date().toISOString();
    
            // find issue by id
            // (returns the found issue or "null")
              // mongoose.Types.ObjectId(id)
            Project.findOne({ project: projectName })
            .populate('issues')
            .exec((err, proj) => {
              if(err || !proj) printPutErrorCouldNotUpdate(id, res);
              else {
                      
                //console.log("PROJ:",proj)
                //console.log("Project found")
                
                const updatedObj = {};
                
                issue_title ?
                  updatedObj.issue_title = issue_title : 0;                
                issue_text ?
                  updatedObj.issue_text = issue_text : 0;                
                created_by ?
                  updatedObj.created_by = created_by : 0;                
                assigned_to ?
                  updatedObj.assigned_to = assigned_to : 0;                
                status_text ?
                  updatedObj.status_text = status_text : 0;

                // find index by id of the issue to be updated in proj.issues array
                // You have to compare STRING === STRING:
                // d._id.toString() === id
                // d._id.toString() === mongoose.Types.ObjectId(id).toString()
                const index = proj.issues.findIndex((d, i) => 
 (d._id.toString() === id));     
                
                // if index not found
                if(index === -1) printPutErrorCouldNotUpdate(id, res);
                else {
                  // index found
                  
                  // check if open value is different from the one in proj.issues array
                  open !== proj.issues[index].open ?
                    updatedObj.open = open : 0;

                  // get the updated date
                  updatedObj.updated_on = new Date().toISOString();
                  
                  
                  // assign updated object to proj.issues[index] object
                  Object.assign(proj.issues[index], updatedObj);

                  // report DATA
                  //console.log("Properties to update:",updatedObj);
                  //console.log("Updated object in Project's issues array:",proj.issues[index]);
                  
                  // save issue
                  proj.save((err, updatedProj) => {
                    if(err || !updatedProj)
                      printPutErrorCouldNotUpdate(id, res);
                    else {
                      printPutSuccessSuccessfullyUpdated(id, res)
                    }
                  });
                }
              }
            });
          }
        }
      }
      else {
        // req.body is empty
        printPutErrorMissingId(res);
      }

    })
    
    //-------------- DELETE: DELETE ISSUE -------------/
    .delete(function (req, res){
      console.log("\/\/-----------DELETE-----------\/\/")
      //console.log("REQ.BODY: ", req.body)
      
      let projectName = req.params.project;
      const id = req.body._id;

      // if req.body is empty or "id" is not included
      if(Object.entries(req.body).length === 0 || !id)
        printDeleteErrorMissingId(res);
      else {
        // req.body has one property, thus "id" is included

        // find project by name
        Project.findOne({ project: projectName} )
        .populate('issues')
        .exec((err, proj) => {
          if(err || !proj)
            printDeleteErrorCouldNotDelete(id, res);
          else {
            // project found

            // find if the "id" exists in proj.issues array
            const idIndex = proj.issues.findIndex((d) => d._id.toString() === id);

            if(idIndex === -1) {
              // issue with "id" not found
              printDeleteErrorCouldNotDelete(id, res);
            }
            else {
              // issue with "id" found

              // filter proj.issues array to not include the specified issue by "id"
              proj.issues = proj.issues.filter((d) => d._id.toString() !== id);
  
              // save filtered project
              proj.save((err, filteredProj) => {
                if(err || !filteredProj)
                  printDeleteErrorCouldNotDelete(id, res);
                else {
                  // Filtered project saved successfully (issue deleted)
                  printDeleteSuccessSuccessfullyDeleted(id, res);
                }
              });
            }
            
          }
        });
      }
    });
    
};


// ------------------ AUXILIARY FUNCTIONS ----------------- //
function printPostErrorRequiredFieldsMissing(res) {
  // all the required fields are not filled in
  const errorMessageObj = {
    error: 'required field(s) missing'
  }
  console.error(errorMessageObj);
  return res.send(errorMessageObj);
}
function printPostSuccessProjectSave(project, res) {
  project.save((err, postedNewProj) => {
    if(err) return console.error(err);
    //console.log("Project posted successfully with a new issue");
    
    const successMessageObj = {
      result: 'successfully submitted',
      _id: postedNewProj.issues.at(-1)._id.toString()
    };
    console.log(successMessageObj);
    
    // find by id the issue update
    //console.log(postedNewProj.issues.at(-1))
    return res.json(postedNewProj.issues.at(-1));
  });
}

function printPutErrorMissingId(res) {
  const errorMessageObj = { error: 'missing _id' };
  console.log(errorMessageObj);
  return res.send(errorMessageObj);
}
function printPutErrorNoUpdateFieldsSent(id, res) {
  const errorMessageObj = {
    error: 'no update field(s) sent',
    '_id': id
  };
  console.error(errorMessageObj);
  return res.send(errorMessageObj);
}
function printPutErrorCouldNotUpdate(id, res) {
  const errorResponseObj = {
    error : "could not update",
    '_id': id
  };
  console.error(errorResponseObj);
  return res.send(errorResponseObj);
}
function printPutSuccessSuccessfullyUpdated(id, res) {
  // issue successfully updated
  const updateResponseObj = {
    result : "successfully updated",
    '_id' : id
  }
  console.log(updateResponseObj);
  return res.json(updateResponseObj);
}

function printDeleteErrorMissingId(res) {
  const errorMessageObj = { error: 'missing _id' };
  console.error(errorMessageObj)
  return res.send(errorMessageObj);
}
function printDeleteErrorCouldNotDelete(id, res) {
  const errorResponseObj = {
    error : "could not delete",
    '_id' : id
  };
  console.log(errorResponseObj);
  return res.send(errorResponseObj);
}
function printDeleteSuccessSuccessfullyDeleted(id, res) {
  const successResponseObj = {
    result : "successfully deleted",
    _id : id
  };
  console.log(successResponseObj);
  return res.json(successResponseObj);
}
//----------------------------------------------------------//