const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLNonNull
} = require('graphql');

const app = express();

// Sample data
const authors = [
	{ id: 1, name: 'J. K. Rowling' },
	{ id: 2, name: 'J. R. R. Tolkien' },
	{ id: 3, name: 'Brent Weeks' }
]

const books = [
	{ id: 1, name: 'Harry Potter and the Chamber of Secrets', authorId: 1 },
	{ id: 2, name: 'Harry Potter and the Prisoner of Azkaban', authorId: 1 },
	{ id: 3, name: 'Harry Potter and the Goblet of Fire', authorId: 1 },
	{ id: 4, name: 'The Fellowship of the Ring', authorId: 2 },
	{ id: 5, name: 'The Two Towers', authorId: 2 },
	{ id: 6, name: 'The Return of the King', authorId: 2 },
	{ id: 7, name: 'The Way of Shadows', authorId: 3 },
	{ id: 8, name: 'Beyond the Shadows', authorId: 3 }
]


const AuthorType = new GraphQLObjectType({
  name: 'Author',
  description: 'Represents an author of a book',
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLInt) },
    name: { type: GraphQLNonNull(GraphQLString) },
    books: { 
      type: GraphQLList(BookType),
      resolve: (author) => {
        return books.filter(book => author.id === book.authorId)
      }
    }
  })
})

const BookType = new GraphQLObjectType({
  name: 'Book',
  description: 'Represents a book written by an author',
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLInt) },  // Don't need resolves since objects have fields
    name: { type: GraphQLNonNull(GraphQLString) },
    authorId: { type: GraphQLNonNull(GraphQLInt) },
    author: { 
      type: new GraphQLNonNull(AuthorType),
      resolve: (book) => {
        return authors.find(author => author.id === book.authorId)
      }
    }
  })
})

// Sample Queries

// {
//   book(id: 1) {
//     name
//     author {
//       name
//     }
//   }
// }


// Sample mutations
// NB: Need to use double quotes for strings, similar to JSON

// mutation {
//   addBook(name: "Harry Potter and the Deathly Hallows", authorId: 1)
// }


// Note: fields returns a function instead of an object
// due to the cyclic dependency of BookType and AuthorType
// on each other

const RootQueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Root query',
  fields: () => ({
    book: {
      type: BookType,
      description: 'A single book',
      args: {
        id: { type: GraphQLInt }
      },
      resolve: (parent, args) => {
        return books.find(book => args.id === book.id)  // If we had a real DB, would perform queries to get this
      }
    },
    books: {
      type: GraphQLList(BookType),
      description: 'List of books',
      resolve: () => books
    },
    author: {
      type: AuthorType,
      description: 'A single author',
      args: {
        id: { type: GraphQLInt }
      },
      resolve: (parent, args) => {
        return authors.find(author => args.id === author.id)
      }
    },
    authors: {
      type: GraphQLList(AuthorType),
      description: 'List of authors',
      resolve: () => authors
    }
  })
})


// A GraphQL mutation is akin to HTTP POST/UPDATE/DELETE requests
const RootMutationType = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Root mutation',
  fields: () => ({
    addBook: {
      type: BookType,
      description: 'Add a single book',
      args: {
        name: { type: GraphQLNonNull(GraphQLString) },
        authorId: { type: GraphQLNonNull(GraphQLInt) },
      },
      resolve: (parent, args) => {
        const book = { 
          id: books.length + 1,
          name: args.name,
          authorId: args.authorId
        }
        books.push(book);
      }
    },
    addAuthor: {
      type: AuthorType,
      description: 'Add a single author',
      args: {
        name: { type: GraphQLNonNull(GraphQLString) }
      },
      resolve: (parent, args) => {
        const author = { 
          id: authors.length + 1,
          name: args.name,
        }
        authors.push(author);
      }
    }
  })
})

const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: RootMutationType
})

app.use(
  '/graphql', 
  graphqlHTTP({
    schema: schema,
    graphiql: true
  })
)

app.listen(process.env.PORT || 5000, () => {
  console.log('Server running on port 5000');
})