let allBooks = require('./books');
let allAuthors = require('./authors');

console.log(allBooks);
let DB={
  books:allBooks,
  authors:allAuthors
}

module.exports  = DB;
