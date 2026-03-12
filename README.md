# Girlfriend Portal

About a year ago my girlfriend shared a tweet with me about a girl whose boyfriend built her a online grievance portal (https://x.com/sehahaj/status/1922344404565553523). 

That summer for her birthday, I built her my own version of this portal and she loves it. 

We both have our own unique accounts and can each add, reply and delete grievances/posts.

At first I deployed it using Railway, however the free trial ended after a few months. I decided to re-dploy it using Render and MongoDB Atlas which do not have a time-restricted free trial. I did this with the help of ClaudeCode.


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
