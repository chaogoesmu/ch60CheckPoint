const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const bodyParser = require('body-parser')
const uuid = require('uuid/v4')
const url = require('url');
const DB = require('./dataStore/index.js')

app.disable('x-powered-by')
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))
app.use(bodyParser.json())

function fullUrl(req) {
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  });
}


let uuid2 = (dataSet)=>{
  let returnUUID = uuid();
  while(true){
    if(dataSet.filter(x=>x.id===returnUUID).length===0)
    {
      return returnUUID;
    }
    returnUUID = uuid();
  }
}

let verifyInt = (x)=>x==parseInt(x)?parseInt(x):false;

//TODO:use closure to store the variable, pull everything into a function that allows this,
//call it from another link, eventually have it store anything with a function.


app.use(bodyParser.json());



//***** Books ******

let collection = DB.books;
let whatWeAreCollecting = "books"
//custom objects are functions that return an objects

app.get(`/${whatWeAreCollecting}`, (req, res)=>{
  let limit = verifyInt(req.query.limit);
  if(!!limit)
  {
    return res.status(200).send(DB.books.slice(0,limit));
  }
  return res.status(200).send(DB.books);
})

app.get(`/${whatWeAreCollecting}/:id`, (req,res)=>{
  let charOut = getBooks(req.params.id);
  if(charOut)
  {
    return res.status(200).send(charOut);
  }
  return res.status(404).send('no books found matching parameters');
})

app.post(`/${whatWeAreCollecting}`, (req,res)=>{
  console.log(req.body);
  if(req.body.Title && !DB.books.filter(x=>x.name===req.body.Title)[0])
  {
    if(req.body.Title.length>29)
    {
      return res.status(400).send('tl;dr');
    }
    let newmovie = {Title:req.body.Title, ID:uuid2(DB.books), Borrowed: false, Authors:[]};
    DB.books.push(newmovie);

    return res.status(201).send(newmovie);
  }
  return res.status(400).send('no name provided');
})

app.put(`/${whatWeAreCollecting}/:id`,(req,res)=>{
  let objOut = DB.books.filter(x=>x.id===req.params.id)[0];
  if(objOut)
  {
    objOut.Title=req.body.Title;
    objOut.Borrowed=req.body.Borrowed;
    objOut.Authors=req.body.Authors;
    return res.status(200).send(objOut);
  }
  return res.status(404).send(objOut);
})

app.delete(`/${whatWeAreCollecting}/:id`, (req,res)=>{
  let indexDelete = DB.books.findIndex(x=>x.id===req.params.id);
  let objDelete = DB.books[indexDelete];
  if(objDelete)
  {
    objDelete = [objDelete];
    DB.books.splice(indexDelete,1);
    return res.status(200).send(objDelete);
  }
  return res.status(404).send('characters not found');
})


app.get('/', (req,res)=>{
  return res.status(200).send(`<a href=${fullUrl(req)}${whatWeAreCollecting}>Currently Collecting: ${whatWeAreCollecting}</a>`)
})




//***** Authors ******
collection = DB.authors;
whatWeAreCollecting = "authors"

let getBooks = (bId) =>{
  let theBook = DB.books.filter(x=>x.ID===bId)[0]
  return theBook;
}

let authorArrayFilter = (collection, filtered) =>{
//get matching collections from the authors object that match the books.authors.
  return collection.filter(x=>{
    for(let y of filtered.Authors)
    {
      if(y===x.ID)
      {
        return true;
      }
    }
    return false;
  })};

app.get(`/books/:bId/${whatWeAreCollecting}`, (req, res)=>{
  let theBook = getBooks(req.params.bId);
  let retVal = authorArrayFilter(DB.authors, theBook)
  console.log(retVal);
  return res.status(200).send(retVal);
})

app.get(`/books/:bId/${whatWeAreCollecting}/:id`, (req,res)=>{
  let charOut = authorArrayFilter(DB.authors, getBooks(req.params.bId)).filter(x=>x.id===req.params.id)[0]
  if(charOut)
  {
    return res.status(200).send(charOut);
  }
  return res.status(404).send('no characters found matching parameters');
})



app.post(`/books/:bId/${whatWeAreCollecting}`, (req,res)=>{
  console.log(req.body);
  let theBook = getBooks(req.params.bId);
  if(req.body.FirstName && req.body.LastName)
  {
    let newAuthor = {First: req.body.FirstName , Last: req.body.LastName, ID:uuid2(DB.authors)};
    DB.authors.push(newAuthor);
    theBook.Authors.push(newAuthor.ID)
    return res.status(201).send(newmovie);
  }
  return res.status(400).send('no name provided');
})


app.put(`/books/:bId/${whatWeAreCollecting}/:id`,(req,res)=>{
  let theBook = getBooks(req.params.bId);
  let authorToEdit = authorArrayFilter(DB.authors, theBook).filter(x=>x.ID==req.params.id)[0]
  if(authorToEdit)
  {
    authorToEdit.First= req.body.FirstName;
    authorToEdit.First= req.body.LastName;
    return res.status(200).send(authorToEdit);
  }
  return res.status(404).send("unable to edit author");
})


app.delete(`/books/:bId/${whatWeAreCollecting}/:id`, (req,res)=>{
  let theBook = getBooks(req.params.bId);
  let indexDelete = DB.authors.findIndex(x=>x.ID===req.params.id);
  let objDelete = DB.authors[indexDelete];
  if(objDelete)
  {
    theBook.Authors.splice(theBook.Authors.findIndex(x=>x===req.params.id),1);
    objDelete = [objDelete];
    DB.authors.splice(indexDelete,1);
    return res.status(200).send(objDelete);
  }
  return res.status(404).send('Author not found');
})



app.use(bodyParser.json())
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Collection listening on: ${port}!`)
  })
}

module.exports = app
/*
Technical Library
Books

    ID: (You Choose) A unique id that represents the book. Created automatically.
    Name: (String) Name of the book. Cannot be longer than 30 characters. Required.
    Borrowed: (Boolean) True/false value that represents whether or not the book has been borrowed. Required. Defaults to false.
    Description: (String) A description of the book. Optional.
    Authors: (Array) An array of authors.

Authors

    ID: (You Choose) A unique id that represents the author. Created automatically.
    First Name: (String) First name of the author. Required.
    Last Name: (String) Last name of the author. Required.

Authors will have different IDs even if they have the same first and last name.

Build RESTful routes so that you can:

    Create, Read, Update, and Delete books
    Create, Read, Update, and Delete authors through books

*/
