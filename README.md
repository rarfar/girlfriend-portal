# Girlfriend Portal

About a year ago my girlfriend shared a tweet with me about a girl whose boyfriend built her a online grievance portal (https://x.com/sehahaj/status/1922344404565553523). 

That summer for her birthday, I built her my own version of this portal and she loves it. 

We both have our own unique accounts and can each add, reply and delete grievances/posts.

At first I deployed it using Railway, however the free trial ended after a few months. I decided to re-dploy it using Render and MongoDB Atlas which do not have a time-restricted free trial. 


## Features

- **Submit Grievances** - Share thoughts with a title, description, and severity level (1-5)
- **Mood Indicators** - Choose from 9 cute cat character moods (Happy, Sad, Angry, Confused, Cute, Yucky, Professional, Oop, Magical)
- **Reply System** - Respond to each other's grievances
- **User Authentication** - Secure login with JWT tokens
- **Falling Petals Animation** - Cute animated petals on the landing page

## Tech Stack

**Frontend:**
- React 19
- React Router DOM
- Axios
- GSAP (animations)

**Backend:**
- Node.js
- Express 5
- MongoDB with Mongoose
- JWT Authentication
- bcrypt password hashing

**Deployment:**
- Frontend & Backend: Render
- Database: MongoDB Atlas

## Project Structure

```
girlfriend-portal/
├── client/          # React frontend
│   ├── src/
│   │   ├── App.js   # Main application
│   │   └── App.css  # Styles
│   └── public/
│       └── png/     # Pet character images
├── server/          # Express backend
│   ├── server.js    # API server
│   ├── models/      # Mongoose schemas
│   └── migrate.js   # SQLite to MongoDB migration
└── package.json     # Root scripts for deployment
```

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```
3. Create `server/.env`:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```
4. Start the server:
   ```bash
   cd server && npm start
   ```
5. Start the client (in another terminal):
   ```bash
   cd client && npm start
   ```

## Deployment

The app is configured for deployment on Render with MongoDB Atlas.

Set these environment variables on Render:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Set to `production`
