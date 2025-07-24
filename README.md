# Basic Full Stack Chat App

This is a simple real-time chat application built using Express.js and Socket.IO for the backend, and React for the frontend. It supports basic user signup and real-time messaging between users.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Express.js + TypeScript + Socket.IO
- **Database:** Prisma (PostgreSQL)
- **Package Manager:** Yarn

## Getting Started

### 1. Clone the repository

```
git clone https://github.com/your-username/chat-app.git
cd chat-app
```

### 2. Install dependencies

#### Backend

```
cd chat-be
yarn
```

#### Frontend

```
cd ../chat-fe
yarn
```

## 3. Set Up the Database

### Configure the `.env` file in the `chat-be/` directory:

Create a `.env` file and add the following:

```
DB_HOST="localhost"
DB_DATABASE="{databse-name}"
DB_USERNAME="{databas-ename}"
DB_PASSWORD="{database-password}"
DB_PORT=5432
DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}?schema=public"
```

## migrate the database:

```
npx prisma migrate dev

This will apply the existing migrations and set up your local database.

Make sure your `.env` file contains the correct `DATABASE_URL`, and that your PostgreSQL instance is running.

```

## Create Test Users

### Run the backend server:

```
cd chat-be
yarn dev
```

### Create users

Use Postman, cURL, or your browser to create users with this endpoint:

**POST** `http://localhost:5000/auth/signup`

**Request Body:**

```
{
  "name": "user",
  "email": "user@gmail.com",
  "password": "user123"
}
```

Repeat the above request with different names and emails to create two users for chatting.

## Start Frontend

```
cd chat-fe
yarn dev
```

## Start Chatting

Open two separate browser windows (or incognito tabs).

In the **first tab**, go to:

```
http://localhost:5173/chat/<sender_id>/<receiver_id>
```

In the **second tab**, reverse the IDs:

```
http://localhost:5173/chat/<receiver_id>/<sender_id>
```

### Example:

- Tab 1: http://localhost:5173/chat/cmdg5g9up0000weqkj6v41ikk/cmdg7t0s30000we2kqggh4zit
- Tab 2: http://localhost:5173/chat/cmdg7t0s30000we2kqggh4zit/cmdg5g9up0000weqkj6v41ikk

Now you can chat and see messages delivered in real time!

## Notes

- Make sure the backend is running before using the frontend.
- You must manually edit the URL to include the sender and receiver user IDs.
- Authentication is basic and for demo purposes only.

## License

This project is open source and free to use.
